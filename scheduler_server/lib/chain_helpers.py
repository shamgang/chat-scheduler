from langchain_core.messages.system import SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate, SystemMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.agents.format_scratchpad.openai_tools import (
    format_to_openai_tool_messages,
)
from langchain.agents import AgentExecutor
from langchain.agents.output_parsers.openai_tools import OpenAIToolsAgentOutputParser


def create_chain(model, system_message, message_history_buffer=None):
    """Create a chain that expects an "input" key. History optional"""
    messages = [
        SystemMessage(system_message),
        HumanMessagePromptTemplate.from_template("{input}")
    ]
    
    if message_history_buffer:
        messages.insert(1, MessagesPlaceholder(variable_name="chat_history"))

    prompt = ChatPromptTemplate.from_messages(messages)
    
    output_parser = StrOutputParser()
    
    chain = (
        prompt
        | model
        | output_parser
    )

    if message_history_buffer:
        chain = RunnableWithMessageHistory(
            chain,
            # This is needed because in most real world scenarios, a session id is needed
            # It isn't really used here because we are using a simple in memory ChatMessageHistory
            lambda session_id: message_history_buffer,
            input_messages_key="input",
            history_messages_key="chat_history",
        )

    return chain


def create_agent(model, tools, system_message, message_history_buffer=None, verbose=True):
    """ An agent that expects input in an "input" key. History optional."""
    messages = [
        SystemMessage(system_message),
        HumanMessagePromptTemplate.from_template("{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ]
    
    if message_history_buffer:
        messages.insert(1, MessagesPlaceholder(variable_name="chat_history"))
        
    prompt = ChatPromptTemplate.from_messages(messages)
    
    llm_with_tools = model.bind_tools(tools)
    
    agent = (
        RunnablePassthrough.assign(
            agent_scratchpad=lambda x: format_to_openai_tool_messages(
                x["intermediate_steps"]
            )
        )
        | prompt
        | llm_with_tools
        | OpenAIToolsAgentOutputParser()
    )
    
    if verbose:
        chain = AgentExecutor(agent=agent, tools=tools, verbose=True, return_intermediate_steps=True)
    else:
        chain = AgentExecutor(agent=agent, tools=tools)

    if message_history_buffer:
        chain = RunnableWithMessageHistory(
            chain,
            # This is needed because in most real world scenarios, a session id is needed
            # It isn't really used here because we are using a simple in memory ChatMessageHistory
            lambda session_id: message_history_buffer,
            input_messages_key="input",
            history_messages_key="chat_history",
        )

    return chain


def invoke_chain(chain, input):
    """Invoke a chain that expects an "input" key, with dummy config for message history"""
    result = chain.invoke(
        {"input": input},
        # This is needed because in most real world scenarios, a session id is needed
        # It isn't really used here because we are using a simple in memory ChatMessageHistory
        config={"configurable": {"session_id": "<foo>"}},
    )
    if isinstance(result, dict) and 'output' in result:
        return result['output']
    else:
        return result
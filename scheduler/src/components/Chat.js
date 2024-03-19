import {
  MinChatUiProvider,
  MainContainer,
  MessageInput,
  MessageContainer,
  MessageList,
  MessageHeader
} from "@minchat/react-chat-ui";
import { generateDisplayMessages } from "../helpers/DisplayMessages";
import { Authors } from "../services/MessageService";

function Chat({onSendMessage, messages}) {
  let displayMessages = generateDisplayMessages(messages);

  return (
    <MinChatUiProvider theme="#6ea9d7">
      <MainContainer style={{ height: '100vh' }}>
        <MessageContainer>
          <MessageHeader />
          <MessageList
            currentUserId={Authors.USER.toLowerCase()}
            messages={displayMessages}
          />
          <MessageInput
            placeholder="Type message here"
            onSendMessage={onSendMessage}
            showAttachButton={false}
          />
        </MessageContainer>
      </MainContainer>
    </MinChatUiProvider>
  );
}

export default Chat;

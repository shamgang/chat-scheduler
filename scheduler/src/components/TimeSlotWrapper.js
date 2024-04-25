import { Children, cloneElement } from 'react';

const TimeSlotWrapper = ({value, children, resource, onSlotTap, onSlotHover}) => {
  let addedProps = {
    onTouchEnd: () => {
      onSlotTap(value);
    }
  };
  if (onSlotHover) {
    addedProps.onMouseEnter = () => onSlotHover(value);
  }
  return (
    <a className='slot-anchor'>
    {
      cloneElement(Children.only(children), addedProps)
    }
    </a>
  )
};

export default TimeSlotWrapper;
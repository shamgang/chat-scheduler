import { Children, cloneElement } from 'react';

const TimeSlotWrapper = ({value, children, resource, onSlotTap}) => {
  return cloneElement(Children.only(children), {
    onTouchEnd: () => {
      onSlotTap(value);
    }
  });
};

export default TimeSlotWrapper;
import * as React from "react";
import { type ViewProps } from "react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";

export interface EntranceViewProps extends ViewProps {
  delay?: number;
  children?: React.ReactNode;
}

export function EntranceView({ delay = 0, style, children, ...rest }: EntranceViewProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(450).springify().reduceMotion(ReduceMotion.System)}
      style={style}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

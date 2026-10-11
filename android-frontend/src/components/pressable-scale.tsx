/* eslint-disable react-hooks/immutability */
import * as React from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  ReduceMotion,
} from "react-native-reanimated";

const AP = Animated.createAnimatedComponent(Pressable);

export function PressableScale({ style, onPressIn, onPressOut, ...rest }: PressableProps) {
  const s = useSharedValue(1);
  const st = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
    opacity: s.value < 1 ? 0.92 : 1,
  }));

  return (
    <AP
      {...rest}
      style={[st, style]}
      onPressIn={(e) => {
        s.value = withSpring(0.97, {
          damping: 15,
          stiffness: 300,
          reduceMotion: ReduceMotion.System,
        });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
          reduceMotion: ReduceMotion.System,
        });
        onPressOut?.(e);
      }}
    />
  );
}

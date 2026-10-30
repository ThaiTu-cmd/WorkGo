import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, spacing } from './theme';

export function Lightbox({ uri, caption, onClose }: { uri: string | null; caption?: string; onClose: () => void }) {
  return (
    <Modal visible={Boolean(uri)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="Đóng ảnh" style={styles.backdrop} onPress={onClose}>
        {uri ? <Image source={{ uri }} style={styles.image} contentFit="contain" /> : null}
        {caption ? (
          <View style={styles.caption}>
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  image: { width: '100%', height: '80%' },
  caption: { padding: spacing.lg },
  captionText: { color: colors.white, fontSize: font.body, textAlign: 'center' },
});

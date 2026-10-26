import React from "react";
import { StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import { MascotContactSheet } from "@/components/mascot/MascotContactSheet";
import { useColors } from "@/hooks/useColors";

export default function MascotPreviewScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Stack.Screen
        options={{
          title: "Mascot States & Motion",
          headerShown: true,
          headerBackTitle: "Back",
        }}
      />
      <MascotContactSheet onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuthScreen } from '../screens/AuthScreen';
import { TodoScreen } from '../screens/TodoScreen';
import { colors } from '../styles/theme';

type RootStackParamList = {
  Auth: undefined;
  Todos: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent
  }
};

export const AppNavigator = () => {
  const { ready, isAuthenticated } = useAuth();

  if (!ready) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        key={isAuthenticated ? 'auth-yes' : 'auth-no'}
        screenOptions={{
          contentStyle: styles.content,
          headerStyle: styles.header,
          headerTintColor: colors.text,
          headerTitleStyle: styles.headerTitle
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Todos" component={TodoScreen} options={{ title: 'Todo Flight Deck' }} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  content: {
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.surface
  },
  headerTitle: {
    color: colors.text
  }
});

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/theme';

export const AuthScreen = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    setError(null);
    setBusy(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      }
      else {
        await register(username, password);
      }
    }
    catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Authentication failed';
      setError(message);
    }
    finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Immersive Todo Mobile</Text>
      <Text style={styles.subtitle}>Login or register to sync your workflow.</Text>

      <View style={styles.modeRow}>
        <Pressable style={[styles.modeButton, mode === 'login' && styles.modeActive]} onPress={() => setMode('login')}>
          <Text style={styles.modeText}>Login</Text>
        </Pressable>
        <Pressable
          style={[styles.modeButton, mode === 'register' && styles.modeActive]}
          onPress={() => setMode('register')}
        >
          <Text style={styles.modeText}>Register</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submitButton} onPress={() => void submit()} disabled={busy}>
        <Text style={styles.submitText}>{busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 12
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700'
  },
  subtitle: {
    color: colors.muted,
    marginBottom: 12
  },
  modeRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden'
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surface
  },
  modeActive: {
    backgroundColor: colors.surfaceAlt
  },
  modeText: {
    color: colors.text,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.surface
  },
  error: {
    color: colors.danger
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    alignItems: 'center'
  },
  submitText: {
    fontWeight: '700',
    color: '#03281a'
  }
});

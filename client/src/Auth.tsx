import { useNavigate } from 'react-router-dom';
import { getUsername } from './services/user';
import { removeCookie, setCookie } from 'typescript-cookie';
import React, { useEffect, useMemo } from 'react';

export function SignedIn() {
  useMemo(() => {
    async function setUsername() {
      const username = await getUsername();
      setCookie('username', username);
    }
    setUsername();
  }, []);

  setCookie('signedInAt', new Date().toISOString());

  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, [navigate]);

  return <div />;
}

export function SignedOut() {
  useMemo(() => {
    removeCookie('username');
  }, []);

  removeCookie('signedInAt');

  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, [navigate]);

  return <div />;
}

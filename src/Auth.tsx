import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getUsername } from "src/services/cognito";
import { removeCookie, setCookie } from "typescript-cookie";

export function SignedIn() {
  useMemo(() => {
    async function setUsername() {
      const username = await getUsername();
      setCookie("username", username);
    }
    setUsername();
  }, []);

  setCookie("signedInAt", new Date().toISOString());

  const navigate = useNavigate();
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return <div />;
}

export function SignedOut() {
  useMemo(() => {
    removeCookie("username");
  }, []);

  removeCookie("signedInAt");

  const navigate = useNavigate();
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return <div />;
}

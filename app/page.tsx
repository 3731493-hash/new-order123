"use client";

import { useEffect, useState } from "react";

import Home from "@/components/Home";
import Lobby from "@/components/Lobby";
import Nickname from "@/components/Nickname";
import Room from "@/components/Room";

import {
  getPlayerId,
  type Player,
  subscribePlayers,
} from "@/lib/room";

type Screen = "home" | "nickname" | "room" | "lobby";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState("");

  useEffect(() => {
    if (screen !== "lobby" || !roomCode) {
      setPlayers([]);
      return;
    }

    setCurrentPlayerId(getPlayerId());

    const unsubscribe = subscribePlayers(
      roomCode,
      (nextPlayers) => {
        setPlayers(nextPlayers);
      },
      () => {
        alert("참가자 목록을 불러오지 못했습니다.");
      },
    );

    return () => {
      unsubscribe();
    };
  }, [screen, roomCode]);

  const currentPlayer = players.find(
    (player) => player.id === currentPlayerId,
  );

  const isHost = currentPlayer?.isHost ?? false;

  if (screen === "home") {
    return (
      <Home
        onStart={() => {
          setScreen("nickname");
        }}
      />
    );
  }

  if (screen === "nickname") {
    return (
      <Nickname
        onBack={() => {
          setScreen("home");
        }}
        onComplete={(name) => {
          setNickname(name);
          setScreen("room");
        }}
      />
    );
  }

  if (screen === "room") {
    return (
      <Room
        nickname={nickname}
        onBack={() => {
          setScreen("nickname");
        }}
        onCreate={(createdRoomCode) => {
          setRoomCode(createdRoomCode);
          setScreen("lobby");
        }}
        onJoin={(joinedRoomCode) => {
          setRoomCode(joinedRoomCode);
          setScreen("lobby");
        }}
      />
    );
  }

  return (
    <Lobby
      roomCode={roomCode}
      players={players}
      isHost={isHost}
    />
  );
}
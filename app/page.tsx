"use client";

import { useState } from "react";

import Home from "@/components/Home";
import Nickname from "@/components/Nickname";
import Room from "@/components/Room";
import Lobby from "@/components/Lobby";

type Screen = "home" | "nickname" | "room" | "lobby";

type Player = {
  id: string;
  name: string;
  isHost: boolean;
  rank: string;
};

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [nickname, setNickname] = useState("");

  const [roomCode] = useState("DEMO01");

  const [players] = useState<Player[]>([
    {
      id: "1",
      name: "HOST",
      isHost: true,
      rank: "이병",
    },
  ]);

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
        onBack={() => setScreen("home")}
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
        onBack={() => setScreen("nickname")}
        onCreate={() => setScreen("lobby")}
        onJoin={() => setScreen("lobby")}
      />
    );
  }

  return (
    <Lobby
      roomCode={roomCode}
      players={[
        players[0],
        {
          id: "2",
          name: nickname,
          isHost: false,
          rank: "이병",
        },
      ]}
      isHost={true}
    />
  );
}
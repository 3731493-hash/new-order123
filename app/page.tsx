"use client";

import { useEffect, useState } from "react";

import Home from "@/components/Home";
import Lobby from "@/components/Lobby";
import Nickname from "@/components/Nickname";
import Room from "@/components/Room";

import {
  getPlayerId,
  getSavedRoom,
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
  const [isRestoring, setIsRestoring] = useState(true);

  // 앱을 다시 열었을 때 저장된 방으로 자동 복귀
  useEffect(() => {
    let isActive = true;

    async function restoreGame() {
      try {
        const savedRoom = await getSavedRoom();

        if (!isActive) {
          return;
        }

        if (savedRoom) {
          setNickname(savedRoom.nickname);
          setRoomCode(savedRoom.roomCode);
          setCurrentPlayerId(savedRoom.playerId);
          setScreen("lobby");
          return;
        }

        const savedNickname = localStorage.getItem(
          "new-order-nickname",
        );

        if (savedNickname) {
          setNickname(savedNickname);
        }
      } catch (error) {
        console.error("게임 복구 오류:", error);
      } finally {
        if (isActive) {
          setIsRestoring(false);
        }
      }
    }

    void restoreGame();

    return () => {
      isActive = false;
    };
  }, []);

  // 로비 참가자 목록 실시간 불러오기
  useEffect(() => {
    if (screen !== "lobby" || !roomCode) {
      setPlayers([]);
      return;
    }

    if (!currentPlayerId) {
      setCurrentPlayerId(getPlayerId());
    }

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
  }, [screen, roomCode, currentPlayerId]);

  const currentPlayer = players.find(
    (player) => player.id === currentPlayerId,
  );

  const isHost = currentPlayer?.isHost ?? false;

  if (isRestoring) {
    return (
      <main className="app-screen dark-theme">
        <section className="form-panel">
          <p className="section-label">NEW ORDER</p>

          <h1 className="form-title">
            게임을
            <br />
            불러오는 중...
          </h1>
        </section>
      </main>
    );
  }

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
          setCurrentPlayerId(getPlayerId());
          setScreen("lobby");
        }}
        onJoin={(joinedRoomCode) => {
          setRoomCode(joinedRoomCode);
          setCurrentPlayerId(getPlayerId());
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
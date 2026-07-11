"use client";

import { useEffect, useState } from "react";

import Game from "@/components/Game";
import Home from "@/components/Home";
import Lobby from "@/components/Lobby";
import Nickname from "@/components/Nickname";
import Room from "@/components/Room";

import {
  getPlayerId,
  getSavedRoom,
  leaveRoom,
  type Player,
  startGame,
  subscribePlayers,
  subscribeRoom,
} from "@/lib/room";

type Screen =
  | "home"
  | "nickname"
  | "room"
  | "lobby"
  | "game";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    if (
      (screen !== "lobby" && screen !== "game") ||
      !roomCode
    ) {
      setPlayers([]);
      return;
    }

    if (!currentPlayerId) {
      setCurrentPlayerId(getPlayerId());
    }

    const unsubscribe = subscribePlayers(
      roomCode,
      setPlayers,
      () => {
        alert("참가자 목록을 불러오지 못했습니다.");
      },
    );

    return unsubscribe;
  }, [screen, roomCode, currentPlayerId]);

  useEffect(() => {
    if (
      (screen !== "lobby" && screen !== "game") ||
      !roomCode
    ) {
      return;
    }

    const unsubscribe = subscribeRoom(
      roomCode,
      (room) => {
        if (!room) {
          alert("방이 종료되었습니다.");
          setRoomCode("");
          setPlayers([]);
          setScreen("home");
          return;
        }

        if (room.status === "playing") {
          setScreen("game");
        } else {
          setScreen("lobby");
        }
      },
      () => {
        alert("방 상태를 불러오지 못했습니다.");
      },
    );

    return unsubscribe;
  }, [screen, roomCode]);

  const currentPlayer = players.find(
    (player) => player.id === currentPlayerId,
  );

  const isHost = currentPlayer?.isHost ?? false;

  async function handleStartGame() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      await startGame(roomCode);
    } catch (error) {
      console.error("게임 시작 오류:", error);

      if (
        error instanceof Error &&
        error.message === "NOT_HOST"
      ) {
        alert("방장만 게임을 시작할 수 있습니다.");
      } else {
        alert("게임을 시작하지 못했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLeaveRoom() {
    if (isLoading) {
      return;
    }

    const confirmed = window.confirm(
      screen === "game"
        ? "게임에서 나가시겠습니까?"
        : "방에서 나가시겠습니까?",
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);

    try {
      await leaveRoom(roomCode);

      setRoomCode("");
      setPlayers([]);
      setCurrentPlayerId("");
      setScreen("home");
    } catch (error) {
      console.error("방 나가기 오류:", error);
      alert("방에서 나가지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

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
    return <Home onStart={() => setScreen("nickname")} />;
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

  if (screen === "game") {
    return (
      <Game
        roomCode={roomCode}
        player={currentPlayer}
        playerCount={players.length}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return (
    <Lobby
      roomCode={roomCode}
      players={players}
      isHost={isHost}
      isLoading={isLoading}
      onStart={handleStartGame}
      onLeave={handleLeaveRoom}
    />
  );
}
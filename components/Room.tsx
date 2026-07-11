"use client";

import { useState } from "react";
import {
  createRoom,
  joinRoom,
} from "@/lib/room";

type RoomProps = {
  nickname: string;
  onCreate: (roomCode: string) => void;
  onJoin: (roomCode: string) => void;
  onBack: () => void;
};

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "알 수 없는 오류가 발생했습니다.";
  }

  switch (error.message) {
    case "INVALID_NAME":
      return "닉네임을 다시 입력해주세요.";

    case "INVALID_ROOM_CODE":
      return "방 코드를 입력해주세요.";

    case "ROOM_NOT_FOUND":
      return "존재하지 않는 방입니다.";

    case "ROOM_FULL":
      return "방의 최대 인원은 8명입니다.";

    case "GAME_ALREADY_STARTED":
      return "이미 게임이 시작된 방입니다.";

    case "ROOM_CODE_GENERATION_FAILED":
      return "방 코드를 만들지 못했습니다. 다시 시도해주세요.";

    case "permission-denied":
      return "Firebase 접근 권한이 없습니다.";

    default:
      return "요청을 처리하지 못했습니다. 다시 시도해주세요.";
  }
}

export default function Room({
  nickname,
  onCreate,
  onJoin,
  onBack,
}: RoomProps) {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreateRoom() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const roomCode = await createRoom(nickname);
      onCreate(roomCode);
    } catch (error) {
      console.error("방 생성 오류:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinRoom() {
    if (isLoading) {
      return;
    }

    const normalizedCode = joinCode.trim().toUpperCase();

    if (!normalizedCode) {
      setErrorMessage("방 코드를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const roomCode = await joinRoom(normalizedCode, nickname);
      onJoin(roomCode);
    } catch (error) {
      console.error("방 참가 오류:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-screen dark-theme">
      <section className="form-panel">
        <button
          type="button"
          className="back-button"
          onClick={() => {
            if (showJoinForm) {
              setShowJoinForm(false);
              setErrorMessage("");
              return;
            }

            onBack();
          }}
          disabled={isLoading}
        >
          ← BACK
        </button>

        <div className="section-number">02</div>

        <p className="section-label">
          {showJoinForm ? "JOIN ROOM" : "SELECT MODE"}
        </p>

        {!showJoinForm ? (
          <>
            <h1 className="room-title">
              환영합니다.
              <br />
              <span>{nickname}</span>
            </h1>

            <p className="form-description">
              새로운 방을 만들거나
              <br />
              친구의 방에 참가하세요.
            </p>

            {errorMessage && (
              <p className="room-error-message">
                {errorMessage}
              </p>
            )}

            <div className="room-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleCreateRoom}
                disabled={isLoading}
              >
                {isLoading ? "방 만드는 중..." : "방 만들기"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowJoinForm(true);
                  setErrorMessage("");
                }}
                disabled={isLoading}
              >
                방 참가
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="form-title">
              방 코드를
              <br />
              입력하세요.
            </h1>

            <p className="form-description">
              방장에게 전달받은
              <br />
              6자리 코드를 입력하세요.
            </p>

            <input
              type="text"
              className="nickname-input room-code-input"
              value={joinCode}
              maxLength={6}
              autoFocus
              autoComplete="off"
              placeholder="예: A7K2P9"
              onChange={(event) => {
                const nextCode = event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "");

                setJoinCode(nextCode);
                setErrorMessage("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleJoinRoom();
                }
              }}
            />

            {errorMessage && (
              <p className="room-error-message">
                {errorMessage}
              </p>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={handleJoinRoom}
              disabled={isLoading || joinCode.length !== 6}
            >
              {isLoading ? "참가하는 중..." : "참가하기"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
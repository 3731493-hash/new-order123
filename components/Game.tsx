"use client";

import { useEffect, useState } from "react";
import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  subscribePlayers,
  type Player,
} from "@/lib/room";

type GameProps = {
  roomCode: string;
  player?: Player;
  playerCount: number;
  onLeave: () => void;
};

const RANKS = [
  "이병",
  "일병",
  "상병",
  "병장",
  "소위",
  "중위",
  "대위",
  "소령",
  "중령",
  "대령",
] as const;

export default function Game({
  roomCode,
  player,
  playerCount,
  onLeave,
}: GameProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    const unsubscribe = subscribePlayers(
      roomCode,
      (updatedPlayers) => {
        setPlayers(updatedPlayers);
      },
      (error) => {
        console.error("게임 참가자 불러오기 오류:", error);
      },
    );

    return unsubscribe;
  }, [roomCode]);

  async function promotePlayer(
    targetPlayer: Player,
  ) {
    if (!player?.isHost) {
      alert("방장만 계급을 변경할 수 있습니다.");
      return;
    }

    if (isLoading) {
      return;
    }

    const currentRankIndex = RANKS.indexOf(
      targetPlayer.rank as (typeof RANKS)[number],
    );

    if (currentRankIndex === -1) {
      alert("현재 계급을 확인할 수 없습니다.");
      return;
    }

    if (currentRankIndex >= RANKS.length - 1) {
      alert("이미 최고 계급인 대령입니다.");
      return;
    }

    const nextRank = RANKS[currentRankIndex + 1];

    setIsLoading(true);

    try {
      await updateDoc(
        doc(
          db,
          "rooms",
          roomCode,
          "players",
          targetPlayer.id,
        ),
        {
          rank: nextRank,
          updatedAt: serverTimestamp(),
        },
      );
    } catch (error) {
      console.error("진급 오류:", error);
      alert("계급을 변경하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  const displayedPlayers =
    players.length > 0
      ? players
      : player
        ? [player]
        : [];

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <button
          type="button"
          style={styles.leaveButton}
          onClick={onLeave}
        >
          ← 게임 나가기
        </button>

        <p style={styles.eyebrow}>
          GAME STARTED
        </p>

        <p style={styles.roomCode}>
          ROOM {roomCode}
        </p>

        <h1 style={styles.title}>
          게임이
          <br />
          시작되었습니다.
        </h1>

        <div style={styles.summaryBox}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>
              현재 참가자
            </span>

            <strong style={styles.summaryValue}>
              {players.length || playerCount}명
            </strong>
          </div>

          <div style={styles.summaryDivider} />

          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>
              나의 계급
            </span>

            <strong style={styles.summaryValue}>
              {player?.rank ?? "이병"}
            </strong>
          </div>
        </div>

        <div style={styles.myProfile}>
          <span style={styles.myProfileLabel}>
            현재 플레이어
          </span>

          <strong style={styles.myProfileName}>
            {player?.name ?? "플레이어"}
          </strong>

          {player?.isHost && (
            <span style={styles.hostBadge}>
              방장
            </span>
          )}
        </div>

        <section style={styles.rankSection}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionEyebrow}>
                RANK SYSTEM
              </p>

              <h2 style={styles.sectionTitle}>
                참가자 계급
              </h2>
            </div>

            {player?.isHost && (
              <span style={styles.testBadge}>
                방장 테스트
              </span>
            )}
          </div>

          <div style={styles.playerList}>
            {displayedPlayers.map(
              (targetPlayer) => {
                const isMe =
                  targetPlayer.id === player?.id;

                const isMaxRank =
                  targetPlayer.rank ===
                  RANKS[RANKS.length - 1];

                return (
                  <div
                    key={targetPlayer.id}
                    style={styles.playerRow}
                  >
                    <div style={styles.playerInfo}>
                      <div style={styles.playerNameLine}>
                        <strong
                          style={styles.playerName}
                        >
                          {targetPlayer.name}
                        </strong>

                        {isMe && (
                          <span style={styles.meBadge}>
                            나
                          </span>
                        )}

                        {targetPlayer.isHost && (
                          <span
                            style={styles.smallHostBadge}
                          >
                            방장
                          </span>
                        )}
                      </div>

                      <span style={styles.playerRank}>
                        {targetPlayer.rank}
                      </span>
                    </div>

                    {player?.isHost && (
                      <button
                        type="button"
                        disabled={
                          isLoading || isMaxRank
                        }
                        style={{
                          ...styles.promoteButton,
                          ...(isLoading || isMaxRank
                            ? styles.disabledButton
                            : {}),
                        }}
                        onClick={() => {
                          void promotePlayer(
                            targetPlayer,
                          );
                        }}
                      >
                        {isMaxRank
                          ? "최고 계급"
                          : "+1 진급"}
                      </button>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </section>

        <p style={styles.description}>
          모든 참가자는 이병에서 시작합니다.
          <br />
          현재는 방장이 테스트 버튼으로
          참가자의 계급을 올릴 수 있습니다.
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #300006 0%, #0b0b0b 42%, #000 100%)",
    color: "#ffffff",
    padding: "28px 18px 60px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "560px",
    margin: "0 auto",
  },

  leaveButton: {
    border: "none",
    background: "transparent",
    color: "#a9a9a9",
    fontSize: "14px",
    cursor: "pointer",
    padding: "10px 0",
    marginBottom: "44px",
  },

  eyebrow: {
    margin: "0 0 10px",
    color: "#ff1f35",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "3px",
  },

  roomCode: {
    margin: "0 0 18px",
    color: "#8d8d8d",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "2px",
  },

  title: {
    margin: "0 0 30px",
    fontSize: "clamp(42px, 12vw, 72px)",
    lineHeight: 0.98,
    letterSpacing: "-4px",
    fontWeight: 950,
  },

  summaryBox: {
    display: "flex",
    alignItems: "stretch",
    border: "1px solid #292929",
    background: "rgba(10, 10, 10, 0.8)",
    marginBottom: "14px",
  },

  summaryItem: {
    display: "flex",
    flex: 1,
    flexDirection: "column" as const,
    gap: "8px",
    padding: "20px",
  },

  summaryDivider: {
    width: "1px",
    background: "#292929",
  },

  summaryLabel: {
    color: "#777",
    fontSize: "12px",
    fontWeight: 700,
  },

  summaryValue: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: 950,
  },

  myProfile: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #292929",
    background: "rgba(10, 10, 10, 0.8)",
    padding: "18px 20px",
    marginBottom: "34px",
  },

  myProfileLabel: {
    color: "#777",
    fontSize: "12px",
  },

  myProfileName: {
    marginLeft: "auto",
    fontSize: "16px",
  },

  hostBadge: {
    border: "1px solid #ff1f35",
    color: "#ff1f35",
    padding: "4px 7px",
    fontSize: "10px",
    fontWeight: 900,
  },

  rankSection: {
    borderTop: "2px solid #ff1f35",
    borderBottom: "1px solid #292929",
    background: "rgba(7, 7, 7, 0.9)",
    padding: "24px 20px 8px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
  },

  sectionEyebrow: {
    margin: "0 0 5px",
    color: "#ff1f35",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "2px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "23px",
    fontWeight: 950,
  },

  testBadge: {
    border: "1px solid #444",
    color: "#999",
    padding: "6px 8px",
    fontSize: "10px",
    fontWeight: 800,
  },

  playerList: {
    display: "flex",
    flexDirection: "column" as const,
  },

  playerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    minHeight: "74px",
    borderTop: "1px solid #252525",
  },

  playerInfo: {
    display: "flex",
    minWidth: 0,
    flex: 1,
    flexDirection: "column" as const,
    gap: "7px",
  },

  playerNameLine: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "6px",
  },

  playerName: {
    overflow: "hidden",
    color: "#fff",
    fontSize: "15px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },

  meBadge: {
    borderRadius: "999px",
    background: "#ffffff",
    color: "#000",
    padding: "2px 7px",
    fontSize: "9px",
    fontWeight: 900,
  },

  smallHostBadge: {
    border: "1px solid #ff1f35",
    color: "#ff1f35",
    padding: "2px 5px",
    fontSize: "9px",
    fontWeight: 900,
  },

  playerRank: {
    color: "#ff1f35",
    fontSize: "19px",
    fontWeight: 950,
  },

  promoteButton: {
    flexShrink: 0,
    border: "1px solid #ff1f35",
    background: "transparent",
    color: "#ff1f35",
    minWidth: "84px",
    padding: "11px 10px",
    fontSize: "12px",
    fontWeight: 950,
    cursor: "pointer",
  },

  disabledButton: {
    borderColor: "#363636",
    color: "#5f5f5f",
    cursor: "not-allowed",
  },

  description: {
    margin: "24px 0 0",
    color: "#777",
    fontSize: "12px",
    lineHeight: 1.8,
    textAlign: "center" as const,
  },
} satisfies Record<
  string,
  React.CSSProperties
>;
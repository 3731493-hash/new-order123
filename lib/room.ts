import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  rank: string;
};

const MAX_PLAYERS = 8;

export function createRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  return Array.from({ length: 6 }, () => {
    return chars[Math.floor(Math.random() * chars.length)];
  }).join("");
}

export function getPlayerId() {
  const savedId = localStorage.getItem("new-order-player-id");

  if (savedId) {
    return savedId;
  }

  const newId = crypto.randomUUID();

  localStorage.setItem("new-order-player-id", newId);

  return newId;
}

async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = createRoomCode();
    const roomSnapshot = await getDoc(doc(db, "rooms", code));

    if (!roomSnapshot.exists()) {
      return code;
    }
  }

  throw new Error("ROOM_CODE_GENERATION_FAILED");
}

export async function createRoom(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("INVALID_NAME");
  }

  const code = await createUniqueRoomCode();
  const playerId = getPlayerId();

  await setDoc(doc(db, "rooms", code), {
    code,
    status: "waiting",
    hostId: playerId,
    maxPlayers: MAX_PLAYERS,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "rooms", code, "players", playerId), {
    id: playerId,
    name: trimmedName,
    rank: "이병",
    isHost: true,
    joinedAt: serverTimestamp(),
  });

  return code;
}

export async function joinRoom(code: string, name: string) {
  const normalizedCode = code.trim().toUpperCase();
  const trimmedName = name.trim();

  if (!normalizedCode) {
    throw new Error("INVALID_ROOM_CODE");
  }

  if (!trimmedName) {
    throw new Error("INVALID_NAME");
  }

  const roomRef = doc(db, "rooms", normalizedCode);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    throw new Error("ROOM_NOT_FOUND");
  }

  const roomData = roomSnapshot.data();

  if (roomData.status !== "waiting") {
    throw new Error("GAME_ALREADY_STARTED");
  }

  const playersRef = collection(
    db,
    "rooms",
    normalizedCode,
    "players",
  );

  const playersSnapshot = await getDocs(playersRef);
  const playerId = getPlayerId();

  const alreadyJoined = playersSnapshot.docs.some(
    (playerDocument) => playerDocument.id === playerId,
  );

  if (!alreadyJoined && playersSnapshot.size >= MAX_PLAYERS) {
    throw new Error("ROOM_FULL");
  }

  await setDoc(
    doc(db, "rooms", normalizedCode, "players", playerId),
    {
      id: playerId,
      name: trimmedName,
      rank: "이병",
      isHost: roomData.hostId === playerId,
      joinedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return normalizedCode;
}

export function subscribePlayers(
  roomCode: string,
  callback: (players: Player[]) => void,
  onError?: (error: Error) => void,
) {
  const normalizedCode = roomCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("INVALID_ROOM_CODE");
  }

  const playersRef = collection(
    db,
    "rooms",
    normalizedCode,
    "players",
  );

  return onSnapshot(
    playersRef,
    (snapshot) => {
      const players = snapshot.docs.map((playerDocument) => {
        return playerDocument.data() as Player;
      });

      players.sort((first, second) => {
        if (first.isHost !== second.isHost) {
          return first.isHost ? -1 : 1;
        }

        return first.name.localeCompare(second.name, "ko");
      });

      callback(players);
    },
    (error) => {
      console.error("플레이어 구독 오류:", error);

      if (onError) {
        onError(error);
      }
    },
  );
}
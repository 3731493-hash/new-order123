import {
  collection,
  doc,
  getDoc,
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

export function createRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  return Array.from({ length: 6 }, () => {
    return chars[Math.floor(Math.random() * chars.length)];
  }).join("");
}

export function getPlayerId() {
  const saved = localStorage.getItem("new-order-player-id");

  if (saved) return saved;

  const id = crypto.randomUUID();

  localStorage.setItem("new-order-player-id", id);

  return id;
}

export async function createRoom(name: string) {
  const code = createRoomCode();

  const playerId = getPlayerId();

  await setDoc(doc(db, "rooms", code), {
    code,
    status: "waiting",
    hostId: playerId,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "rooms", code, "players", playerId), {
    id: playerId,
    name,
    rank: "이병",
    isHost: true,
    joinedAt: serverTimestamp(),
  });

  return code;
}

export async function joinRoom(code: string, name: string) {
  const room = await getDoc(doc(db, "rooms", code));

  if (!room.exists()) {
    throw new Error("ROOM_NOT_FOUND");
  }

  const playerId = getPlayerId();

  await setDoc(doc(db, "rooms", code, "players", playerId), {
    id: playerId,
    name,
    rank: "이병",
    isHost: false,
    joinedAt: serverTimestamp(),
  });
}

export function subscribePlayers(
  roomCode: string,
  callback: (players: Player[]) => void
) {
  return onSnapshot(
    collection(db, "rooms", roomCode, "players"),
    (snapshot) => {
      const players = snapshot.docs.map((doc) => doc.data() as Player);

      players.sort((a, b) => {
        if (a.isHost === b.isHost) {
          return a.name.localeCompare(b.name);
        }

        return a.isHost ? -1 : 1;
      });

      callback(players);
    }
  );
}
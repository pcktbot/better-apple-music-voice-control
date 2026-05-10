export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS tracks (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    artist      TEXT,
    album       TEXT,
    genre       TEXT,
    duration    INTEGER,
    playlist_ids TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS playlists (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    track_count INTEGER DEFAULT 0,
    synced_at   INTEGER DEFAULT (unixepoch())
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS tracks_fts USING fts5(
    name, artist, album, genre,
    content=tracks,
    content_rowid=rowid
  );

  CREATE TRIGGER IF NOT EXISTS tracks_ai AFTER INSERT ON tracks BEGIN
    INSERT INTO tracks_fts(rowid, name, artist, album, genre)
    VALUES (new.rowid, new.name, new.artist, new.album, new.genre);
  END;

  CREATE TRIGGER IF NOT EXISTS tracks_ad AFTER DELETE ON tracks BEGIN
    INSERT INTO tracks_fts(tracks_fts, rowid, name, artist, album, genre)
    VALUES ('delete', old.rowid, old.name, old.artist, old.album, old.genre);
  END;

  CREATE TRIGGER IF NOT EXISTS tracks_au AFTER UPDATE ON tracks BEGIN
    INSERT INTO tracks_fts(tracks_fts, rowid, name, artist, album, genre)
    VALUES ('delete', old.rowid, old.name, old.artist, old.album, old.genre);
    INSERT INTO tracks_fts(rowid, name, artist, album, genre)
    VALUES (new.rowid, new.name, new.artist, new.album, new.genre);
  END;
`;

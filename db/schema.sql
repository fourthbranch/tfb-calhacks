CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    preferred_topics TEXT[] NOT NULL,
    locations TEXT[] DEFAULT '{}',
    political_leaning TEXT,
    preferred_writing_style TEXT[3] NOT NULL,
    additional_info TEXT
);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    topic_bias TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE articles_new (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    relevant_topics TEXT[] NOT NULL,
    preferred_writing_style TEXT[3] NOT NULL,
    bias TEXT,
    topic_bias TEXT,
    opposite_view TEXT,
    CONSTRAINT fk_report
        FOREIGN KEY(id)
        REFERENCES reports(id)
        ON DELETE CASCADE
);

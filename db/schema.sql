DROP TABLE IF EXISTS problem_band_stats;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS contests;

CREATE TABLE contests (
    contest_id int NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    started_at timestamptz, 
    duration_seconds integer NOT NULL,
    PRIMARY KEY (contest_id)
);

CREATE TABLE problems (
    contest_id int NOT NULL,
    problem_index text NOT NULL,
    name text NOT NULL,
    rating smallint,
    tags text[] NOT NULL,
    PRIMARY KEY (contest_id, problem_index),
    FOREIGN KEY (contest_id) REFERENCES contests (contest_id)
);

CREATE TABLE problem_band_stats (
    contest_id int NOT NULL,
    problem_index text NOT NULL,
    band_start smallint NOT NULL,
    entered int NOT NULL,
    attempted int NOT NULL,
    solved int NOT NULL,
    PRIMARY KEY (contest_id, problem_index, band_start),
    FOREIGN KEY (contest_id, problem_index) REFERENCES problems (contest_id, problem_index)
);

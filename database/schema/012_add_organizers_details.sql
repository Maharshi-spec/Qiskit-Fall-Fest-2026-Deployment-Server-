-- 1. Add name column
ALTER TABLE organizers
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- 2. Insert organizers
INSERT INTO organizers (name, email, password)
VALUES
    ('Uthasv Pinnaka', 'uthsavpinnaka1814@gmail.com', '123456'),
    ('Dinesh Kartheek Vajrapu', 'dineshkartheekvajrapu@gmail.com', '123456'),
    ('Kokkerapalli Pallavi', 'kokkerapallavi@gmail.com', '123456'),
    ('Bhuvana Kruthika Kappala', 'bhuvanakruthikappala@gmail.com', '123456'),
    ('Mukunda Balakrishna', 'mukundabalakrishna7@gmail.com', '123456'),
    ('Rishika Saraf', 'rishikasaraf11@gmail.com', '123456'),
    ('Shaik Minhazuddin', 'shaikminhazuddin@gmail.com', '123456'),
    ('Laxmikant Sutar', 'laxmikantsutar@cutmap.ac.in', '123456'),
    ('Dhanush Prataparao', 'dhanushprataparao@gmail.com', '123456'),
    ('V K', 'vk7798537@gmail.com', '123456'),
    ('Tekupudi Balaji', 'tekupudibalaji@gmail.com', '123456'),
    ('Maharshi', 'maha.dev.2c0@gmail.com', '123456'),
    ('Harshavardhan', 'harshavardhan99901@gmail.com', '123456'),
    ('sai Tej', 'mrtej117@gmail.com', '123456');
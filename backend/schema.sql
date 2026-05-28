CREATE DATABASE IF NOT EXISTS zero_hunger;
USE zero_hunger;

CREATE TABLE IF NOT EXISTS barangays (
  barangay_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS families (
  family_id      INT AUTO_INCREMENT PRIMARY KEY,
  barangay_id    INT NOT NULL,
  household_id   VARCHAR(50) NULL,
  family_name    VARCHAR(150) NOT NULL,
  address        VARCHAR(255) NOT NULL,
  head_of_family VARCHAR(150),
  phone          VARCHAR(50),
  monthly_income DECIMAL(12,2) NULL,
  food_assistance_status VARCHAR(255) NOT NULL DEFAULT 'None',
  is_npa         TINYINT(1) NOT NULL DEFAULT 0,
  priority_score INT NOT NULL DEFAULT 0,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  image          LONGBLOB NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_families_barangay
    FOREIGN KEY (barangay_id) REFERENCES barangays(barangay_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS family_members (
  member_id          INT AUTO_INCREMENT PRIMARY KEY,
  family_id          INT NOT NULL,
  first_name         VARCHAR(100),
  last_name          VARCHAR(100),
  date_of_birth      DATE NULL,
  gender             VARCHAR(20),
  relationship       VARCHAR(50) NOT NULL DEFAULT 'Other',
  is_pwd             TINYINT(1) NOT NULL DEFAULT 0,
  height_cm          DECIMAL(5,2) NULL,
  weight_kg          DECIMAL(5,2) NULL,
  nutritional_status VARCHAR(50) NOT NULL DEFAULT 'Unknown',
  CONSTRAINT fk_family_members_family
    FOREIGN KEY (family_id) REFERENCES families(family_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS individuals (
  individual_id              INT AUTO_INCREMENT PRIMARY KEY,
  name                       VARCHAR(150) NOT NULL,
  date_of_birth              DATE NULL,
  gender                     VARCHAR(20),
  barangay_id                INT NULL,
  registered_by_barangay_id  INT NULL,
  status                     VARCHAR(50),
  height_cm                  DECIMAL(5,2) NULL,
  weight_kg                  DECIMAL(5,2) NULL,
  image                      LONGBLOB NULL,
  created_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_individuals_barangay
    FOREIGN KEY (barangay_id) REFERENCES barangays(barangay_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS food_supplies (
  food_id        INT AUTO_INCREMENT PRIMARY KEY,
  food_name      VARCHAR(150) NOT NULL,
  unit           VARCHAR(50) NOT NULL,
  total_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  barangay_id    INT NULL,
  type           ENUM('food','equipment') NOT NULL DEFAULT 'food',
  donation_id    INT NULL,
  CONSTRAINT fk_food_supplies_barangay
    FOREIGN KEY (barangay_id) REFERENCES barangays(barangay_id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS donors (
  donor_id     INT AUTO_INCREMENT PRIMARY KEY,
  donor_name   VARCHAR(150) NOT NULL,
  contact_info VARCHAR(255),
  email        VARCHAR(255) NULL,
  phone        VARCHAR(50) NULL
);

CREATE TABLE IF NOT EXISTS donations (
  donation_id      INT AUTO_INCREMENT PRIMARY KEY,
  donor_id         INT,
  food_id          INT,
  food_description VARCHAR(255) NULL,
  donation_type    ENUM('food','monetary','equipment') NOT NULL DEFAULT 'food',
  quantity         DECIMAL(12,2) NOT NULL,
  quantity_unit    VARCHAR(50) NOT NULL DEFAULT 'kg',
  date_given       DATE NOT NULL,
  image            LONGBLOB NULL,
  barangay_id      INT NULL,
  status           ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  tracking_number  VARCHAR(20) NULL UNIQUE,
  approved_by      INT NULL,
  approved_at      DATETIME NULL,
  rejection_reason TEXT NULL,
  payment_method   VARCHAR(50) NULL,
  donor_message    TEXT NULL,
  is_archived      TINYINT(1) NOT NULL DEFAULT 0,
  archived_at      DATETIME NULL,
  archived_by      INT NULL,
  CONSTRAINT fk_donations_donor
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_donations_food
    FOREIGN KEY (food_id) REFERENCES food_supplies(food_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_donations_barangay
    FOREIGN KEY (barangay_id) REFERENCES barangays(barangay_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS distribution (
  distribution_id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_type  VARCHAR(50) NOT NULL,
  family_id       INT,
  individual_id   INT,
  barangay_id     INT,
  distribution_type VARCHAR(20) NOT NULL DEFAULT 'Food',
  food_id         INT,
  quantity        DECIMAL(12,2) NOT NULL,
  date_given      DATE NOT NULL,
  status          VARCHAR(50) NOT NULL,
  image           LONGBLOB NULL,
  CONSTRAINT fk_distribution_family
    FOREIGN KEY (family_id) REFERENCES families(family_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_distribution_individual
    FOREIGN KEY (individual_id) REFERENCES individuals(individual_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_distribution_barangay
    FOREIGN KEY (barangay_id) REFERENCES barangays(barangay_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_distribution_food
    FOREIGN KEY (food_id) REFERENCES food_supplies(food_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS distribution_activity_logs (
  activity_id          INT AUTO_INCREMENT PRIMARY KEY,
  distribution_id      INT NULL,
  action               VARCHAR(20) NOT NULL,
  staff_user_id        VARCHAR(64) NULL,
  staff_name           VARCHAR(150) NOT NULL,
  staff_email          VARCHAR(255) NULL,
  distribution_details TEXT,
  performed_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_distribution
    FOREIGN KEY (distribution_id) REFERENCES distribution(distribution_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS users (
  user_id    INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20) NOT NULL,
  barangay_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_barangay
    FOREIGN KEY (barangay_id) REFERENCES barangays(barangay_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- ─── SEED BARANGAYS ───────────────────────────────────────────────────────────
INSERT IGNORE INTO barangays (name) VALUES
  ('Aguho'),
  ('Magtanggol'),
  ("Martires del '96"),
  ('Poblacion'),
  ('San Pedro'),
  ('San Roque'),
  ('Santa Ana'),
  ('Santo Rosario-Kanluran'),
  ('Santo Rosario-Silangan'),
  ('Tabacalera');

-- ─── MIGRATIONS (run one at a time on existing Railway DB) ───────────────────
-- ALTER TABLE donations ADD COLUMN payment_method VARCHAR(50) NULL;
-- ALTER TABLE donations ADD COLUMN donor_message TEXT NULL;
-- ALTER TABLE donations ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0;
-- ALTER TABLE donations ADD COLUMN archived_at DATETIME NULL;
-- ALTER TABLE donations ADD COLUMN archived_by INT NULL;

-- ─── DEFAULT ADMIN USER (password: admin123) ─────────────────────────────────
INSERT IGNORE INTO users (name, email, password, role, barangay_id) VALUES
  ('Administrator', 'admin@pateros.gov.ph', '$2b$10$A3Bg8F3oq4T9aWqtBq.kvO3tHkhI0txfLkg/kgoade/BMEO0LNOcG', 'Admin', NULL),
  ('Barangay Staff', 'staff@barangay.gov.ph', '$2b$10$yrSJoKTimXxpwms7tleIKeqIP1M89w2JcYnCt/Msb5SvMXZnbVJlK', 'Staff', 1);

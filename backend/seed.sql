USE zero_hunger;

-- ─── Barangays (all 10, correct names) ───────────────────────────────────────
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

-- ─── Sample users (password: Test1234) ───────────────────────────────────────
INSERT INTO users (name, email, password, role, barangay_id)
VALUES
  ('Test Admin',  'example_admin@barangay.gov.ph',  '$2b$10$9qaieYxQBZXGEaX5ZDy5COlSP0AK/iZq/j9ka6etCbShuumO77YGe', 'Admin', NULL),
  ('Test Staff',  'example_staff@barangay.gov.ph',  '$2b$10$9qaieYxQBZXGEaX5ZDy5COlSP0AK/iZq/j9ka6etCbShuumO77YGe', 'Staff', 4)
ON DUPLICATE KEY UPDATE email = email;

-- ─── Sample families ─────────────────────────────────────────────────────────
INSERT IGNORE INTO families
  (barangay_id, household_id, family_name, address, head_of_family, phone,
   monthly_income, food_assistance_status, is_npa, priority_score, is_active)
VALUES
  (4, 'POB-2026-0001', 'Doe Family',    '123 Main St, Poblacion', 'John Doe',   '09171234567', 9500.00,  '4Ps',          0, 75, 1),
  (1, 'AGU-2026-0002', 'Reyes Household','45 Sampaguita St, Aguho', 'Ana Reyes', '09189876543', 11000.00, 'Senior Citizen', 0, 60, 1);

-- ─── Sample family members ────────────────────────────────────────────────────
INSERT IGNORE INTO family_members
  (family_id, first_name, last_name, date_of_birth, gender, relationship, is_pwd, height_cm, weight_kg, nutritional_status)
VALUES
  (1, 'John',  'Doe',   '1980-03-15', 'Male',   'Head',   0, 168.0, 65.0, 'Normal'),
  (1, 'Jane',  'Doe',   '1983-07-22', 'Female', 'Spouse', 0, 155.0, 52.0, 'Normal'),
  (1, 'Carlo', 'Doe',   '2010-11-05', 'Male',   'Child',  0, 135.0, 28.0, 'Underweight'),
  (2, 'Ana',   'Reyes', '1955-04-18', 'Female', 'Head',   0, 152.0, 48.0, 'Normal');

-- ─── Sample individuals ───────────────────────────────────────────────────────
INSERT IGNORE INTO individuals
  (individual_id, name, date_of_birth, gender, barangay_id, status)
VALUES
  (1, 'Pedro Ramos',    '1959-06-10', 'Male',   1, 'Registered'),
  (2, 'Ana Villanueva', '1992-09-25', 'Female', 4, 'Received');

-- ─── Sample food supplies ─────────────────────────────────────────────────────
INSERT IGNORE INTO food_supplies (food_name, unit, total_quantity)
VALUES
  ('Rice',        'kg',    1000),
  ('Canned Goods','can',    500),
  ('Noodles',     'pack',   300);

-- ─── Sample distributions ─────────────────────────────────────────────────────
INSERT IGNORE INTO distribution
  (distribution_id, recipient_type, family_id, individual_id, barangay_id, food_id, quantity, date_given, status)
VALUES
  (1, 'Family',     1, NULL, 4, 1, 25, '2026-05-10', 'Completed'),
  (2, 'Individual', NULL, 1, 1, 2,  5, '2026-05-12', 'Pending');

-- ─── Sample activity logs ─────────────────────────────────────────────────────
INSERT IGNORE INTO distribution_activity_logs
  (activity_id, distribution_id, action, staff_user_id, staff_name, staff_email, distribution_details, performed_at)
VALUES
  (1, 1, 'distributed', '2', 'Test Staff', 'example_staff@barangay.gov.ph',
   'Distribution #1 • Doe Family • Poblacion • Rice (25 kg) • Status: Completed',
   '2026-05-10 09:30:00'),
  (2, 2, 'created',     '2', 'Test Staff', 'example_staff@barangay.gov.ph',
   'Distribution #2 • Pedro Ramos • Aguho • Canned Goods (5 can) • Status: Pending',
   '2026-05-12 13:45:00');

USE zero_hunger;

-- Sample barangays (schema already inserts these; repeat-safe)
INSERT IGNORE INTO barangays (name) VALUES
  ('Aguho'),
  ('Magtanggol'),
  ('Martires del 96'),
  ('Poblacion'),
  ('San Pedro');

-- Sample users (passwords are bcrypt hashes of 'Test1234')
INSERT INTO users (name, email, password, role, barangay_id)
VALUES
  ('Test Admin','example_admin@barangay.gov.ph','$2a$10$CwTycUXWue0Thq9StjUM0uJ8xgkqYb4uK1Vq0pZcB1Dqv1yJZf9e', 'Admin', NULL),
  ('Test Staff','example_staff@barangay.gov.ph','$2a$10$CwTycUXWue0Thq9StjUM0uJ8xgkqYb4uK1Vq0pZcB1Dqv1yJZf9e', 'Staff', 4)
ON DUPLICATE KEY UPDATE email=email;

-- Small sample family
INSERT IGNORE INTO families (barangay_id, family_name, address, head_of_family, phone)
VALUES (4, 'Doe Family', '123 Main St', 'John Doe', '09171234567');

-- Sample food supply
INSERT IGNORE INTO food_supplies (food_name, unit, total_quantity)
VALUES ('Rice', 'kg', 1000), ('Canned Goods', 'can', 500);

INSERT IGNORE INTO distribution (distribution_id, recipient_type, family_id, individual_id, barangay_id, food_id, quantity, date_given, status)
VALUES
  (1, 'Family', 1, NULL, 4, 1, 25, '2026-05-10', 'Completed'),
  (2, 'Individual', NULL, 1, 1, 2, 5, '2026-05-12', 'Pending');

INSERT IGNORE INTO distribution_activity_logs (activity_id, distribution_id, action, staff_user_id, staff_name, staff_email, distribution_details, performed_at)
VALUES
  (1, 1, 'distributed', '2', 'Test Staff', 'example_staff@barangay.gov.ph', 'Distribution #1 • Doe Family • Poblacion • Rice (25 kg) • Status: Completed', '2026-05-10 09:30:00'),
  (2, 2, 'created', '2', 'Test Staff', 'example_staff@barangay.gov.ph', 'Distribution #2 • Pedro Ramos • Aguho • Canned Goods (5 can) • Status: Pending', '2026-05-12 13:45:00');

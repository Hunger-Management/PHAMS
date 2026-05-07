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

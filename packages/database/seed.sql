-- Thiqti - Seed Data
-- 6 vehicles, 3 dealers, offers.
-- NB : aucun avis fictif. Les tables reviews / reputation_scores ne sont
-- remplies que par de vrais avis soumis via le site (POST /api/reputation).

-- ===================== VEHICLES =====================
INSERT INTO vehicles (id, make, model, year, trim, body_type, fuel_type, transmission, seats, price_mad, price_old_mad, power_ch, consumption_l100, co2_gkm, accel_0_100, trunk_liters, length_mm, width_mm, height_mm, wheelbase_mm) VALUES
-- Toyota RAV4 Hybrid
('a1111111-1111-1111-1111-111111111111',
 'Toyota', 'RAV4', 2026, 'Hybrid AWD',
 'suv', 'hybride', 'automatique', 5,
 425000, 445000, 222, 5.6, 130, 8.1, 580, 4600, 1855, 1685, 2690),

-- Hyundai Tucson Hybrid
('a2222222-2222-2222-2222-222222222222',
 'Hyundai', 'Tucson', 2026, 'Hybrid Elite',
 'suv', 'hybride', 'automatique', 5,
 399000, NULL, 230, 6.0, 138, 8.0, 616, 4630, 1865, 1665, 2755),

-- Kia Sportage Hybrid
('a3333333-3333-3333-3333-333333333333',
 'Kia', 'Sportage', 2026, 'Hybrid GT-Line',
 'suv', 'hybride', 'automatique', 5,
 385000, NULL, 230, 5.9, 135, 7.9, 591, 4660, 1865, 1660, 2755),

-- Nissan Qashqai e-Power
('a4444444-4444-4444-4444-444444444444',
 'Nissan', 'Qashqai', 2026, 'e-Power Tekna+',
 'crossover', 'hybride', 'automatique', 5,
 365000, NULL, 190, 5.3, 121, 7.9, 504, 4425, 1835, 1625, 2666),

-- Mitsubishi Outlander PHEV
('a5555555-5555-5555-5555-555555555555',
 'Mitsubishi', 'Outlander', 2026, 'PHEV Instyle',
 'suv', 'plug-in-hybride', 'automatique', 7,
 510000, 535000, 306, 1.7, 46, 7.5, 494, 4710, 1860, 1745, 2705),

-- Ford Kuga PHEV
('a6666666-6666-6666-6666-666666666666',
 'Ford', 'Kuga', 2026, 'PHEV Vignale',
 'suv', 'plug-in-hybride', 'automatique', 5,
 435000, NULL, 225, 1.4, 32, 9.2, 475, 4614, 1883, 1674, 2711);

-- ===================== DEALERS =====================
INSERT INTO dealers (id, name, city, address, phone, lat, lng) VALUES
('d1111111-1111-1111-1111-111111111111',
 'Auto Alliance Maroc', 'Casablanca',
 'Boulevard de la Corniche, Casablanca', '+212 522 123 456',
 33.5731, -7.5898),

('d2222222-2222-2222-2222-222222222222',
 'Prestige Automobile', 'Rabat',
 'Avenue Hassan II, Rabat', '+212 537 789 012',
 34.0209, -6.8416),

('d3333333-3333-3333-3333-333333333333',
 'Sahal Auto', 'Marrakech',
 'Route de l''Ourika, Marrakech', '+212 524 345 678',
 31.6295, -7.9811);

-- ===================== DEALER OFFERS =====================
INSERT INTO dealer_offers (dealer_id, vehicle_id, offer_price_mad, delivery_weeks, promotion, valid_until) VALUES
-- Auto Alliance Maroc - Casablanca
('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 415000, 4, 'Livraison gratuite Casablanca', '2026-09-30'),
('d1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 389000, 3, 'Première année assurance offerte', '2026-08-31'),
('d1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', 498000, 6, 'Pack accessoires offert', '2026-10-31'),

-- Prestige Automobile - Rabat
('d2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 375000, 2, 'Remise immédiate 10 000 MAD', '2026-09-15'),
('d2222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666', 425000, 3, 'Garantie étendue 7 ans', '2026-09-30'),
('d2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 418000, 5, 'Reprise ancien véhicule +15 000 MAD', '2026-08-31'),

-- Sahal Auto - Marrakech
('d3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 355000, 4, 'Financement 0% 24 mois', '2026-10-31'),
('d3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 395000, 2, 'Essai gratuit à domicile', '2026-09-30'),
('d3333333-3333-3333-3333-333333333333', 'a5555555-5555-5555-5555-555555555555', 502000, 5, 'Pack famille complet -20 000 MAD', '2026-08-31');

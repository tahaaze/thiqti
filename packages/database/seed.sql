-- Thiqti - Seed Data
-- 6 vehicles, 3 dealers, offers.
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

-- ===================== REVIEWS =====================
INSERT INTO reviews (vehicle_id, source, author_name, rating, title, body, pros, cons, verified, published_at) VALUES
-- Toyota RAV4
('a1111111-1111-1111-1111-111111111111', 'aggregated', 'Mohammed B.', 8.5, 'Excellent SUV familial', 'La RAV4 hybride est parfaite pour la famille. Consommation tres basse pour un SUV, conduite tres confortable sur autoroute.', ARRAY['Consommation', 'Confort', 'Fiabilite'], ARRAY['Prix eleve', 'Montage multimedia'], true, '2026-03-15'),
('a1111111-1111-1111-1111-111111111111', 'aggregated', 'Fatima Z.', 9.0, 'Top pour routes marocaines', 'J ai pris la RAV4 pour les routes entre Casablanca et Marrakech. Stabilite au top, consommation 5.5L/100.', ARRAY['Tenue de route', 'Consommation', 'Fiabilite'], ARRAY['Finition interieure basique'], true, '2026-05-20'),
('a1111111-1111-1111-1111-111111111111', 'aggregated', 'Youssef A.', 7.5, 'Bon mais cher', 'Bon SUV globalement mais le prix est eleve par rapport a la concurrence. L hybride est un vrai plus.', ARRAY['Hybride', 'Design'], ARRAY['Prix', 'Espace coffre moyen'], true, '2026-06-10'),

-- Hyundai Tucson
('a2222222-2222-2222-2222-222222222222', 'aggregated', 'Amina K.', 8.0, 'Design incroyable', 'Le design de la Tucson est spectaculaire. L interieur est tres bien fini, les technologies sont au rendez-vous.', ARRAY['Design', 'Technologie', 'Confort'], ARRAY['Consommation un peu elevee en ville'], true, '2026-04-05'),
('a2222222-2222-2222-2222-222222222222', 'aggregated', 'Hassan M.', 7.0, 'Satisfait mais connaisse des problemes', 'Bon SUV dans l ensemble mais j ai eu un souci de software a 5000km. Resolu en concession.', ARRAY['Design', 'Garantie 5 ans'], ARRAY['Software', 'Consommation'], true, '2026-07-12'),

-- Kia Sportage
('a3333333-3333-3333-3333-333333333333', 'aggregated', 'Omar L.', 8.5, 'Rapport qualite-prix imbattable', 'La Sportage offre le meilleur rapport qualite-prix du segment. Le hybride est tres performant.', ARRAY['Rapport qualite-prix', 'Hybride', 'Garantie'], ARRAY['Bruit pneus a haute vitesse'], true, '2026-03-28'),
('a3333333-3333-3333-3333-333333333333', 'aggregated', 'Sara T.', 9.0, 'Parfaite pour la famille', 'Avec 3 enfants, la Sportage est ideale. Grand coffre, places arriere spacieuses, consommation correcte.', ARRAY['Espace', 'Coffre', 'Fiabilite'], ARRAY['Moniteur aveugle'], true, '2026-06-22'),

-- Nissan Qashqai
('a4444444-4444-4444-4444-444444444444', 'aggregated', 'Karim R.', 7.5, 'Bon crossover urbain', 'Le Qashqai e-Power est parfait pour la ville. La conduite est fluide et la consommation tres basse.', ARRAY['Confort', 'Consommation', 'Design'], ARRAY['Manque de puissance en depassement'], true, '2026-02-14'),
('a4444444-4444-4444-4444-444444444444', 'aggregated', 'Nadia H.', 8.0, 'Tres satisfaite', 'Le e-Power est une excellente solution. Pas besoin de recharger, ca roule comme une electrique.', ARRAY['Innovant', 'Confort', 'Silencieux'], ARRAY['Coffre petit'], true, '2026-05-30'),

-- Mitsubishi Outlander PHEV
('a5555555-5555-5555-5555-555555555555', 'aggregated', 'Rachid D.', 8.0, 'Le meilleur PHEV du marche', '7 places et une autonomie electrique de 45km. Parfait pour la ville et les sorties famille.', ARRAY['7 places', 'Autonomie electrique', 'Financement'], ARRAY['Prix eleve', 'Coffre reduit en mode 7 places'], true, '2026-04-18'),

-- Ford Kuga PHEV
('a6666666-6666-6666-6666-666666666666', 'aggregated', 'Samir E.', 7.5, 'Bon PHEV mais finition discutable', 'Le Kuga PHEV a une bonne autonomie electrique mais la finition est en deca de la concurrence coreenne.', ARRAY['Autonomie electrique', 'Conduite'], ARRAY['Finition', 'Espace arriere'], true, '2026-06-01'),
('a6666666-6666-6666-6666-666666666666', 'aggregated', 'Leila F.', 8.0, 'Excellent pour les trajets courts', '90% de mes trajets sont en electrique. Le mode hybride est tres bien pour les longues distances.', ARRAY['Electrique', 'Economique'], ARRAY['Bruit en mode thermique'], true, '2026-07-20');

-- ===================== REPUTATION SCORES =====================
INSERT INTO reputation_scores (vehicle_id, avg_rating, total_reviews, reliability, top_pros, top_cons) VALUES
('a1111111-1111-1111-1111-111111111111', 8.3, 3, 'fiable', ARRAY['Consommation', 'Confort', 'Fiabilite'], ARRAY['Prix eleve']),
('a2222222-2222-2222-2222-222222222222', 7.5, 2, 'moyen', ARRAY['Design', 'Technologie'], ARRAY['Consommation']),
('a3333333-3333-3333-3333-333333333333', 8.8, 2, 'fiable', ARRAY['Rapport qualite-prix', 'Espace'], ARRAY['Bruit pneus']),
('a4444444-4444-4444-4444-444444444444', 7.8, 2, 'moyen', ARRAY['Confort', 'Consommation'], ARRAY['Coffre']),
('a5555555-5555-5555-5555-555555555555', 8.0, 1, 'fiable', ARRAY['7 places', 'Autonomie electrique'], ARRAY['Prix eleve']),
('a6666666-6666-6666-6666-666666666666', 7.8, 2, 'moyen', ARRAY['Electrique', 'Economique'], ARRAY['Finition']);

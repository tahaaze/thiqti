-- Thiqti - Seed Data
-- 6 vehicles, sample reviews, 3 dealers, offers

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

-- ===================== REVIEWS =====================
INSERT INTO reviews (vehicle_id, source, author_name, rating, title, body, pros, cons, verified) VALUES
-- RAV4 Hybrid reviews
('a1111111-1111-1111-1111-111111111111', 'aggregated', 'Ahmed B.', 8.5, 'Excellent SUV familial',
 'Le RAV4 Hybrid est un SUV fiable et polyvalent. Consommation très maîtrisée en ville.',
 ARRAY['Fiabilité Toyota','Consommation faible','Habitabilité généreuse','4WD disponible'],
 ARRAY['Intérieur un peu daté','Motorisation bruyante en accélération','Prix élevé'],
 TRUE),

('a1111111-1111-1111-1111-111111111111', 'aggregated', 'Fatima Z.', 8.0, 'Bonne valeur sûre',
 'Un SUV qui ne déçoit pas au quotidien. Parfait pour les familles.',
 ARRAY['Espace coffre','Tenue de route','Facilité de conduite'],
 ARRAY['Écran multimédia perfectible','Finition bas de gamme'],
 TRUE),

-- Tucson Hybrid reviews
('a2222222-2222-2222-2222-222222222222', 'aggregated', 'Youssef M.', 8.8, 'Design sensationnel',
 'Le Tucson impressionne par son design extérieur et intérieur. L''habitabilité est au top.',
 ARRAY['Design extérieur audacieux','Intérieur premium','Garantie 5 ans'],
 ARRAY['Suspension ferme','Consommation autoroutière','Visibility arrière limitée'],
 TRUE),

('a2222222-2222-2222-2222-222222222222', 'aggregated', 'Salma K.', 8.2, 'Très satisfait',
 'Excellent rapport qualité-prix dans le segment des hybrides.',
 ARRAY['Rapport qualité-prix','Équipements série','Service après-vente'],
 ARRAY['Bruit pneus sur revêtement dur','Sellerie tache facilement'],
 TRUE),

-- Sportage Hybrid reviews
('a3333333-3333-3333-3333-333333333333', 'aggregated', 'Omar H.', 8.4, 'Sportif et confortable',
 'La Sportage Hybrid combine dynamisme et confort. Le GT-Line ajoute une touche sport.',
 ARRAY['Conduite dynamique','Coffre généreux','Technologie embarquée'],
 ARRAY['Consommation supérieure aux promises','Bruit à haute vitesse'],
 TRUE),

('a3333333-3333-3333-3333-333333333333', 'aggregated', 'Nadia A.', 8.6, 'Au-delà des attentes',
 'Une crossover qui fait tout bien. Le système hybride est très fluide.',
 ARRAY['Fluidité hybride','Équipement sécurité','Design intérieur'],
 ARRAY['Tarification des accessoires','Chargeur sans fil lent'],
 TRUE),

-- Qashqai e-Power reviews
('a4444444-4444-4444-4444-444444444444', 'aggregated', 'Rachid T.', 7.9, 'Innovant et économique',
 'Le système e-Power est unique. On roule en électrique sans brancher.',
 ARRAY['Système e-Power original','Consommation faible','Confort routier'],
 ARRAY['Puissance modeste','Coffre moyen','Finition plastique'],
 TRUE),

('a4444444-4444-4444-4444-444444444444', 'aggregated', 'Leila B.', 8.1, 'Original et pratique',
 'Idéal pour ceux qui veulent du électrique sans contrainte de recharge.',
 ARRAY['Pas de branchement nécessaire','Ville très agréable','Écran intuitif'],
 ARRAY['Accélération moyenne','Isolation sonore perfectible'],
 TRUE),

-- Outlander PHEV reviews
('a5555555-5555-5555-5555-555555555555', 'aggregated', 'Khalid D.', 8.3, 'PHEV familial 7 places',
 'Le seul SUV hybride rechargeable 7 places du marché marocain. Très pratique.',
 ARRAY['7 places','Autonomie électrique ~45 km','4WD performant'],
 ARRAY['Poids élevé','Coffre réduit en 7 places','Prix premium'],
 TRUE),

('a5555555-5555-5555-5555-555555555555', 'aggregated', 'Amina S.', 8.7, 'La polyvalence absolue',
 'Peut rouler en 100% électrique pour les trajets courts. Parfait pour les familles.',
 ARRAY['Double motorisation','Modes de conduite','Technologie S-AWC'],
 ARRAY['Autonomie EV limitée','Entretien plus coûteux'],
 TRUE),

-- Kuga PHEV reviews
('a6666666-6666-6666-6666-666666666666', 'aggregated', 'Hassan R.', 8.0, 'Le bon compromis',
 'Le Kuga PHEV offre un excellent équilibre entre performance et économie.',
 ARRAY['Consommation très basse','Confort suspendu','SynchroConnect'],
 ARRAY['Design discret','Espace arrière moyen','Charge lente'],
 TRUE),

('a6666666-6666-6666-6666-666666666666', 'aggregated', 'Meryem F.', 7.8, 'Satisfait mais...',
 'Bon SUV hybride rechargeable mais quelques défauts à signaler.',
 ARRAY['Autonomie électrique correcte','Intérieur bien fini','Apple CarPlay'],
 ARRAY['Capot arrière manuel','Sièges arrière plats','Pas de toit ouvrant'],
 TRUE);

-- ===================== REPUTATION SCORES =====================
INSERT INTO reputation_scores (vehicle_id, avg_rating, total_reviews, reliability, top_pros, top_cons) VALUES
('a1111111-1111-1111-1111-111111111111', 8.25, 2, 'fiable', ARRAY['Fiabilité Toyota','Consommation faible'], ARRAY['Intérieur daté','Motorisation bruyante']),
('a2222222-2222-2222-2222-222222222222', 8.50, 2, 'fiable', ARRAY['Design extérieur','Intérieur premium'], ARRAY['Suspension ferme','Consommation autoroute']),
('a3333333-3333-3333-3333-333333333333', 8.50, 2, 'fiable', ARRAY['Conduite dynamique','Équipement sécurité'], ARRAY['Consommation promise','Bruit haute vitesse']),
('a4444444-4444-4444-4444-444444444444', 8.00, 2, 'fiable', ARRAY['Système e-Power','Consommation faible'], ARRAY['Puissance modeste','Coffre moyen']),
('a5555555-5555-5555-5555-555555555555', 8.50, 2, 'fiable', ARRAY['7 places','Autonomie électrique'], ARRAY['Poids élevé','Coffre réduit']),
('a6666666-6666-6666-6666-666666666666', 7.90, 2, 'moyen', ARRAY['Consommation basse','Confort'], ARRAY['Design discret','Espace arrière']);

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

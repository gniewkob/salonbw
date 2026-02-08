-- Dodanie pracowników i testowych danych do UI/UX
-- PostgreSQL version

DO $$
DECLARE
    v_owner_id INTEGER;
    v_employee1_id INTEGER;
    v_employee2_id INTEGER;
    v_category_id INTEGER;
    v_service1_id INTEGER;
    v_service2_id INTEGER;
    v_service3_id INTEGER;
    v_client1_id INTEGER;
    v_client2_id INTEGER;
    v_client3_id INTEGER;
BEGIN
    -- Znajdź właściciela
    SELECT id INTO v_owner_id FROM users WHERE email = 'kontakt@bodora.pl' LIMIT 1;
    
    -- Dodanie pracownika 1: Aleksandra Bodora
    INSERT INTO users (
        email, 
        password, 
        name, 
        role, 
        phone, 
        "firstName", 
        "lastName",
        "receiveNotifications",
        "commissionBase",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'aleksandra.bodora@salon-bw.pl',
        '$2b$10$YourHashedPasswordHere',
        'Aleksandra Bodora',
        'employee',
        '500111222',
        'Aleksandra',
        'Bodora',
        true,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        "updatedAt" = NOW()
    RETURNING id INTO v_employee1_id;

    -- Dodanie pracownika 2: Pracownik Testowy
    INSERT INTO users (
        email, 
        password, 
        name, 
        role, 
        phone, 
        "firstName", 
        "lastName",
        "receiveNotifications",
        "commissionBase",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'pracownik.testowy@salon-bw.pl',
        '$2b$10$YourHashedPasswordHere',
        'Pracownik Testowy',
        'employee',
        '500333444',
        'Pracownik',
        'Testowy',
        true,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        "updatedAt" = NOW()
    RETURNING id INTO v_employee2_id;

    -- Dodanie kategorii usług
    INSERT INTO service_categories (name, description, "createdAt", "updatedAt")
    VALUES ('Koloryzacja', 'Usługi koloryzacji włosów', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_category_id;
    
    IF v_category_id IS NULL THEN
        SELECT id INTO v_category_id FROM service_categories WHERE name = 'Koloryzacja';
    END IF;

    -- Dodanie usługi 1: Koloryzacja
    INSERT INTO services (
        name, 
        description, 
        duration, 
        price, 
        "priceType",
        "categoryId",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'Koloryzacja Ola - włosy długie',
        'Pełna koloryzacja włosów długich',
        180,
        350.00,
        'fixed',
        v_category_id,
        NOW(),
        NOW()
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_service1_id;
    
    IF v_service1_id IS NULL THEN
        SELECT id INTO v_service1_id FROM services WHERE name = 'Koloryzacja Ola - włosy długie';
    END IF;

    -- Dodanie usługi 2: Strzyżenie
    INSERT INTO services (
        name, 
        description, 
        duration, 
        price, 
        "priceType",
        "categoryId",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'Strzyżenie Damskie Ola - włosy średnie',
        'Strzyżenie i modelowanie włosów średniej długości',
        60,
        120.00,
        'fixed',
        v_category_id,
        NOW(),
        NOW()
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_service2_id;
    
    IF v_service2_id IS NULL THEN
        SELECT id INTO v_service2_id FROM services WHERE name = 'Strzyżenie Damskie Ola - włosy średnie';
    END IF;

    -- Dodanie usługi 3: Botoks
    INSERT INTO services (
        name, 
        description, 
        duration, 
        price, 
        "priceType",
        "categoryId",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'Botoks',
        'Zabieg botoksem na włosy',
        90,
        200.00,
        'fixed',
        v_category_id,
        NOW(),
        NOW()
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_service3_id;
    
    IF v_service3_id IS NULL THEN
        SELECT id INTO v_service3_id FROM services WHERE name = 'Botoks';
    END IF;

    -- Przypisanie usług do pracowników
    INSERT INTO employee_services ("employeeId", "serviceId", "createdAt", "updatedAt")
    VALUES 
        (v_employee1_id, v_service1_id, NOW(), NOW()),
        (v_employee1_id, v_service2_id, NOW(), NOW()),
        (v_employee1_id, v_service3_id, NOW(), NOW()),
        (v_employee2_id, v_service1_id, NOW(), NOW()),
        (v_employee2_id, v_service2_id, NOW(), NOW())
    ON CONFLICT DO NOTHING;

    -- Dodanie klientów
    INSERT INTO users (
        email, 
        password, 
        name, 
        role, 
        phone, 
        "firstName", 
        "lastName",
        "receiveNotifications",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'klient.testowy1@example.com',
        '$2b$10$TestPassword',
        'Anna Kowalska',
        'client',
        '600111222',
        'Anna',
        'Kowalska',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        "updatedAt" = NOW()
    RETURNING id INTO v_client1_id;

    INSERT INTO users (
        email, 
        password, 
        name, 
        role, 
        phone, 
        "firstName", 
        "lastName",
        "receiveNotifications",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'klient.testowy2@example.com',
        '$2b$10$TestPassword',
        'Maria Nowak',
        'client',
        '600333444',
        'Maria',
        'Nowak',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        "updatedAt" = NOW()
    RETURNING id INTO v_client2_id;

    INSERT INTO users (
        email, 
        password, 
        name, 
        role, 
        phone, 
        "firstName", 
        "lastName",
        "receiveNotifications",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'klient.testowy3@example.com',
        '$2b$10$TestPassword',
        'Katarzyna Wiśniewska',
        'client',
        '600555666',
        'Katarzyna',
        'Wiśniewska',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        "updatedAt" = NOW()
    RETURNING id INTO v_client3_id;

    -- Usuń stare testowe wizyty z tego dnia (aby uniknąć duplikatów)
    DELETE FROM appointments 
    WHERE DATE("startTime") = '2026-02-08' 
    AND notes LIKE '%test%' OR notes LIKE '%Pierwsza wizyta%' OR notes LIKE '%Strzyżenie%' OR notes LIKE '%Zabieg%';

    -- Wizyta 1: 09:00 - Koloryzacja u Aleksandry
    INSERT INTO appointments (
        "clientId",
        "employeeId",
        "serviceId",
        "startTime",
        "endTime",
        status,
        notes,
        "reservedOnline",
        "createdAt",
        "updatedAt"
    ) VALUES (
        v_client1_id,
        v_employee1_id,
        v_service1_id,
        '2026-02-08 09:00:00',
        '2026-02-08 12:00:00',
        'scheduled',
        'Pierwsza wizyta - koloryzacja',
        false,
        NOW(),
        NOW()
    );

    -- Wizyta 2: 10:30 - Strzyżenie u Pracownika Testowego
    INSERT INTO appointments (
        "clientId",
        "employeeId",
        "serviceId",
        "startTime",
        "endTime",
        status,
        notes,
        "reservedOnline",
        "createdAt",
        "updatedAt"
    ) VALUES (
        v_client2_id,
        v_employee2_id,
        v_service2_id,
        '2026-02-08 10:30:00',
        '2026-02-08 11:30:00',
        'confirmed',
        'Strzyżenie + modelowanie',
        false,
        NOW(),
        NOW()
    );

    -- Wizyta 3: 14:00 - Botoks u Aleksandry
    INSERT INTO appointments (
        "clientId",
        "employeeId",
        "serviceId",
        "startTime",
        "endTime",
        status,
        notes,
        "reservedOnline",
        "createdAt",
        "updatedAt"
    ) VALUES (
        v_client3_id,
        v_employee1_id,
        v_service3_id,
        '2026-02-08 14:00:00',
        '2026-02-08 15:30:00',
        'in_progress',
        'Zabieg regenerujący',
        false,
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Test data added successfully!';
    RAISE NOTICE 'Employees: %, %', v_employee1_id, v_employee2_id;
END $$;

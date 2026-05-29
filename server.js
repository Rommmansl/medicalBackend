const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// const pool = new Pool({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT,
// });
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,       
    idleTimeoutMillis: 120000,
    statementTimeoutMillis: 120000,
    connectionTimeoutMillis: 120000,
    ssl: {
        rejectUnauthorized: false 
    }
});
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err.stack);
    } else {
        console.log('Successfully connected to database');
        release();
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Требуется авторизация' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// Маршруты аутентификации
// Регистрация
app.post('/api/auth/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Проверяем, существует ли пользователь
            const userExists = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );

            if (userExists.rows.length > 0) {
                return res.status(400).json({ message: 'Пользователь уже существует' });
            }

            // Хешируем пароль
            const hashedPassword = await bcrypt.hash(password, 10);

            // Создаем пользователя
            const newUser = await pool.query(
                'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
                [email, hashedPassword]
            );

            // Создаем JWT токен
            const token = jwt.sign(
                { id: newUser.rows[0].id, email: newUser.rows[0].email },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Пользователь успешно зарегистрирован',
                token,
                user: newUser.rows[0]
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Ошибка сервера при регистрации' });
        }
    }
);

// Вход
app.post('/api/auth/login',
    [
        body('email'),
        body('password').notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Ищем пользователя
            const user = await pool.query(
                'SELECT * FROM users WHERE email = $1 and active = true',
                [email]
            );

            if (user.rows.length === 0) {
                return res.status(401).json({ message: 'Неверный email или пароль' });
            }

            // Проверяем пароль
            const validPassword = await bcrypt.compare(password, user.rows[0].password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Неверный email или пароль' });
            }

            // Создаем JWT токен
            const token = jwt.sign(
                { id: user.rows[0].id, email: user.rows[0].email },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Успешный вход',
                token,
                user: { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Ошибка сервера при входе' });
        }
    }
);

// Маршруты для работы с пациентами
// Получить всех пациентов
app.get('/api/patients', authenticateToken, async (req, res) => {
    try {
        const patients = await pool.query(
            'SELECT * FROM patients ORDER BY created_at DESC'
        );
        res.json(patients.rows);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Ошибка при получении списка пациентов' });
    }
});

// Получить всех неактивных пользователей
app.get('/api/patientsExpect', authenticateToken, async (req, res) => {
    try {
        const users = await pool.query(
            'SELECT * FROM users WHERE active = false ORDER BY created_at DESC'
        );
        res.json(users.rows);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Ошибка при получении списка пациентов' });
    }
});

// Получить одного пациента
app.get('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
        const patient = await pool.query(
            'SELECT * FROM patient_complete_info WHERE id = $1',
            [req.params.id]
        );

        if (patient.rows.length === 0) {
            return res.status(404).json({ message: 'Пациент не найден' });
        }
        const patient_list_diseases = await pool.query(
            'SELECT * FROM list_diseases WHERE patient_id = $1',
            [patient.rows[0].id]
        );
        const list_diseases_gynecologica = await pool.query(
            'SELECT * FROM list_diseases_gynecologica WHERE patient_id = $1',
            [patient.rows[0].id]
        );
        const parents = await pool.query(
            'SELECT * FROM parents WHERE patient_id = $1',
            [patient.rows[0].id]
        );
        res.json({ 
            patient: patient.rows[0], 
            patient_list_diseases: patient_list_diseases.rows, 
            patient_list_diseases_gynecologica: list_diseases_gynecologica.rows,
            parents: parents.rows
        });
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ message: 'Ошибка при получении данных пациента' });
    }
});

// Создать нового пациента
app.post('/api/patients',
    authenticateToken,
    [
        body('birth_date').isDate(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, patronymic, surname, birth_date } = req.body;

        try {
            const newPatient = await pool.query(
                'INSERT INTO patients (name, patronymic, surname, birth_date) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, patronymic, surname, birth_date]
            );
            await pool.query(
                `INSERT INTO list_diseases_gynecologica (patient_id, disease_group, disease_name) VALUES 
                    ($1, 0, ''),
                    ($1, 1, ''),
                    ($1, 2, ''),
                    ($1, 3, ''),
                    ($1, 4, ''),
                    ($1, 5, ''),
                    ($1, 6, ''),
                    ($1, 7, ''),
                    ($1, 8, ''),
                    ($1, 9, ''),
                    ($1, 10, ''),
                    ($1, 11, ''),
                    ($1, 12, ''),
                    ($1, 13, ''),
                    ($1, 14, ''),
                    ($1, 15, ''),
                    ($1, 16, ''),
                    ($1, 17, ''),
                    ($1, 18, '')`,
                [newPatient.rows[0].id]
            );
            await pool.query(
                `INSERT INTO list_diseases (patient_id, disease_group, disease_name, disease_group_name) VALUES 
                    ($1, 0, '', ''),
                    ($1, 1, '', ''),
                    ($1, 2, '', ''),
                    ($1, 3, '', ''),
                    ($1, 4, '', ''),
                    ($1, 5, '', ''),
                    ($1, 6, '', ''),
                    ($1, 7, '', ''),
                    ($1, 8, '', ''),
                    ($1, 9, '', ''),
                    ($1, 10, '', ''),
                    ($1, 11, '', ''),
                    ($1, 12, '', ''),
                    ($1, 13, '', ''),
                    ($1, 14, '', ''),
                    ($1, 15, '', ''),
                    ($1, 16, '', ''),
                    ($1, 17, '', ''),
                    ($1, 18, '', '')`,
                [newPatient.rows[0].id]
            );
            await pool.query(
                `INSERT INTO parents (patient_id, parent_type) 
                VALUES ($1, 'father'), ($1, 'mother') 
                RETURNING *`,
                [newPatient.rows[0].id]
            );
            await pool.query(
                `INSERT INTO intrauterine_development (patient_id) 
                VALUES ($1)
                RETURNING *`,
                [newPatient.rows[0].id]
            );
            await pool.query(
                `INSERT INTO newborn_period (patient_id) 
                VALUES ($1)
                RETURNING *`,
                [newPatient.rows[0].id]
            );
            await pool.query(
                `INSERT INTO assessment_age1_7 (patient_id, age_value) VALUES
                ($1, 1),
                ($1, 2),
                ($1, 3),
                ($1, 4),
                ($1, 5),
                ($1, 6),
                ($1, 7)
                RETURNING *`,
                [newPatient.rows[0].id]
            );
            await pool.query(
                `INSERT INTO assessment_age8_11 (patient_id, age_value) VALUES
                ($1, 8),
                ($1, 9),
                ($1, 10),
                ($1, 11)
                RETURNING *`,
                [newPatient.rows[0].id]
            );
            await pool.query(
                `INSERT INTO assessment_age12_18 (patient_id, age_value) VALUES
                ($1, 12),
                ($1, 13),
                ($1, 14),
                ($1, 15),
                ($1, 16),
                ($1, 17),
                ($1, 18)
                RETURNING *`,
                [newPatient.rows[0].id]
            );
            await pool.query(
                `INSERT INTO general_conclusion (patient_id)
                VALUES ($1)
                RETURNING *`,
                [newPatient.rows[0].id]
            );
            res.status(201).json(newPatient.rows[0]);
        } catch (error) {
            console.error('Error creating patient:', error);
            res.status(500).json({ message: 'Ошибка при создании записи пациента' });
        }
    }
);

// Обновить данные пациента
app.put('/api/patients/:id',
    authenticateToken,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { type, ageChild } = req.body;
        try {
            if( type === 'GirlsPassportDetail') {
                const { name, patronymic, surname, birth_date, index, phone, polis_index, polis_company, polis_date, social_status, social_status_text } = req.body;
                const updatedPatient = await pool.query(
                    `UPDATE patients SET 
                    name = $1, 
                    patronymic = $2, 
                    surname = $3, 
                    birth_date = $4, 
                    updated_at = CURRENT_TIMESTAMP, 
                    index = $6, 
                    phone = $7, 
                    polis_index = $8, 
                    polis_company = $9, 
                    polis_date = $10, 
                    social_status = $11, 
                    social_status_text = $12
                    WHERE id = $5 RETURNING *`,
                    [name, patronymic, surname, birth_date, req.params.id, index, phone, polis_index, polis_company, polis_date, social_status, social_status_text]
                );

                if (updatedPatient.rows.length === 0) {
                    return res.status(404).json({ message: 'Пациент не найден' });
                }
                res.json(updatedPatient.rows[0]);
            }   else if (type === 'ListDiseasesOperations') {
                const { formData } = req.body;
                const jsonString = JSON.stringify(formData)
                const updatedPatient = await pool.query(
                    `UPDATE list_diseases 
                    SET disease_name = data.disease_name,
                        disease_group_name = data.disease_group_name
                    FROM jsonb_to_recordset($1::jsonb) 
                    AS data(id integer, disease_name text, disease_group_name text)
                    WHERE list_diseases.patient_id = $2 and list_diseases.id = data.id RETURNING *`,
                    [jsonString, req.params.id]
                );
                if (updatedPatient.rows.length === 0) {
                    return res.status(404).json({ message: 'Пациент не найден' });
                }
                res.json(updatedPatient.rows[0]);
            }   else if (type === 'ListDiseasesOperationsGynecologica') {
                const { formData } = req.body;
                const jsonString = JSON.stringify(formData)
                const updatedPatient = await pool.query(
                    `UPDATE list_diseases_gynecologica 
                    SET disease_name = data.disease_name
                    FROM jsonb_to_recordset($1::jsonb) 
                    AS data(id integer, disease_name text)
                    WHERE list_diseases_gynecologica.patient_id = $2 and list_diseases_gynecologica.id = data.id RETURNING *`,
                    [jsonString, req.params.id]
                );
                if (updatedPatient.rows.length === 0) {
                    return res.status(404).json({ message: 'Пациент не найден' });
                }
                res.json(updatedPatient.rows[0]);
            }   else if (type === 'Parents') {
                const { formData } = req.body;
                const jsonString = JSON.stringify(formData)
                const updatedPatient = await pool.query(
                    `UPDATE parents 
                    SET 
                    parent_type = data.parent_type, 
                    height = data.height, 
                    weight = data.weight, 
                    physique = data.physique, 
                    prof_damage_child_text = data.prof_damage_child_text, 
                    bad_habits_variant = data.bad_habits_variant, 
                    special_diseas_text = data.special_diseas_text, 
                    relative_special_diseas_text = data.relative_special_diseas_text, 
                    indirect_signs_endocrine_imbalance = data.indirect_signs_endocrine_imbalance, 
                    ippp = data.ippp, 
                    infertility = data.infertility, 
                    method_conception_child = data.method_conception_child, 
                    age_time_birth_child = data.age_time_birth_child, 
                    pathology_genital_organs = data.pathology_genital_organs, 
                    operation_sexual_organ = data.operation_sexual_organ, 
                    special_notes = data.special_notes, 
                    menstrual_cycle = data.menstrual_cycle, 
                    previous_gynecological_diseases = data.previous_gynecological_diseases, 
                    previous_chemotherapy_therapy = data.previous_chemotherapy_therapy, 
                    gynecological_operation = data.gynecological_operation, 
                    contraception_eve_pregnancy = data.contraception_eve_pregnancy, 
                    pregnancy = data.pregnancy, 
                    attempt_terminate_pregnancy = data.attempt_terminate_pregnancy
                    FROM jsonb_to_recordset($1::jsonb) 
                    AS data(
                        id integer, 
                        parent_type text, 
                        height text, 
                        weight text, 
                        physique integer, 
                        prof_damage_child_text text, 
                        bad_habits_variant text, 
                        special_diseas_text text, 
                        relative_special_diseas_text text, 
                        indirect_signs_endocrine_imbalance text, 
                        ippp text, 
                        infertility text, 
                        method_conception_child text, 
                        age_time_birth_child integer, 
                        pathology_genital_organs text, 
                        operation_sexual_organ text, 
                        special_notes text, 
                        menstrual_cycle text, 
                        previous_gynecological_diseases text, 
                        previous_chemotherapy_therapy text, 
                        gynecological_operation text, 
                        contraception_eve_pregnancy text, 
                        pregnancy text, 
                        attempt_terminate_pregnancy text)
                    WHERE parents.patient_id = $2 and parents.id = data.id RETURNING *`,
                    [jsonString, req.params.id]
                );
                if (updatedPatient.rows.length === 0) {
                    return res.status(404).json({ message: 'Пациент не найден' });
                }
                res.json(jsonString);
            }   else if (type === 'IntrauterineDevelopment') {
                const { formData } = req.body;
                const { toxicosis_first_half_pregnancy, toxicosis_second_half_pregnancy, signs_threatened_termination_pregnancy, acute_diseases_surgical_interventions_mother, use_hormonal_drugs_mother, signs_fetal_suffering, born_week_pregnancy, childbirth, special_marks_development } = formData;
                const updatedPatient = await pool.query(
                    `UPDATE intrauterine_development SET 
                    toxicosis_first_half_pregnancy = $1, 
                    toxicosis_second_half_pregnancy = $2, 
                    signs_threatened_termination_pregnancy = $3, 
                    acute_diseases_surgical_interventions_mother = $4, 
                    use_hormonal_drugs_mother = $5, 
                    signs_fetal_suffering = $6, 
                    born_week_pregnancy = $7, 
                    childbirth = $8, 
                    special_marks_development = $9
                    WHERE patient_id = $10 RETURNING *`,
                    [
                        toxicosis_first_half_pregnancy, 
                        toxicosis_second_half_pregnancy,
                        signs_threatened_termination_pregnancy, 
                        acute_diseases_surgical_interventions_mother,
                        use_hormonal_drugs_mother,
                        signs_fetal_suffering,
                        born_week_pregnancy,
                        childbirth,
                        special_marks_development,
                        req.params.id
                    ]
                );
                if (updatedPatient.rows.length === 0) {
                    return res.status(404).json({ message: 'Пациент не найден' });
                }
                res.json(updatedPatient.rows[0]);
            }   else if (type === 'NewbornPeriod') {
                const { formData } = req.body;
                const { 
                    height, 
                    weight, 
                    estimate_apgar, 
                    condition, 
                    trauma, 
                    dysembriogenesis, 
                    abnormalities_structure_condition_mammary_glands, 
                    abnormalities_structure_external_genitalia, 
                    postponed_operations, 
                    bcg, 
                    discharged_from_maternity_hospital, 
                    she_department_physiology, 
                    transferred_children_hospital, 
                    she_took_hormonal_medications, 
                    degree_risk_reproductive_disorders, 
                    special_marks_recommendations 
                } = formData;
                const updatedPatient = await pool.query(
                    `UPDATE newborn_period SET 
                    height = $1, 
                    weight = $2, 
                    estimate_apgar = $3, 
                    condition = $4, 
                    trauma = $5, 
                    dysembriogenesis = $6, 
                    abnormalities_structure_condition_mammary_glands = $7, 
                    abnormalities_structure_external_genitalia = $8, 
                    postponed_operations = $9,
                    bcg = $10,
                    discharged_from_maternity_hospital = $11,
                    she_department_physiology = $12,
                    transferred_children_hospital = $13,
                    she_took_hormonal_medications = $14,
                    degree_risk_reproductive_disorders = $15,
                    special_marks_recommendations = $16
                    WHERE patient_id = $17 RETURNING *`,
                    [
                        height, 
                        weight,
                        estimate_apgar, 
                        condition,
                        trauma,
                        dysembriogenesis,
                        abnormalities_structure_condition_mammary_glands,
                        abnormalities_structure_external_genitalia,
                        postponed_operations,
                        bcg,
                        discharged_from_maternity_hospital,
                        she_department_physiology,
                        transferred_children_hospital,
                        she_took_hormonal_medications,
                        degree_risk_reproductive_disorders,
                        special_marks_recommendations,
                        req.params.id
                    ]
                );
                if (updatedPatient.rows.length === 0) {
                    return res.status(404).json({ message: 'Пациент не найден' });
                }
                res.json(updatedPatient.rows[0]);
            }   else if (type === 'AssessmentStatus') {
                const { formData } = req.body;
                const { 
                    height, 
                    weight, 
                    breast_enlargement, 
                    pathological_formations, 
                    abnormalities_structure_external_genitalia, 
                    rostvolos, 
                    pathological_discharge, 
                    hyperemia_skin, 
                    presence_signs_violence, 
                    recimendation, 
                    reusable_diapers, 
                    pediatrician_report, 
                    conclusion_pediatric_gynecologist, 
                    degree_risk_reproductive_disorders, 
                    special_marks,
                    bad_habits,
                    sexual_characteristics,
                    rhythm_features,
                    hair_growth,
                    presence_stripes,
                    presence_acne,
                    structure_external_genitalia,
                    abnormalities_structure,
                    nocturnal_enuresis,
                    daytime_incontinence,
                    stress_incontinence,
                    presence_stains,
                    complaints_pain,
                    uterus,
                    appendages,
                    vaginoscopy,
                    condition_vagina,
                    condition_cervix,
                    gynecologist_report,
                    degree_risk,
                    sex,
                    number_partners,
                    contraception,
                    motivation,
                    pregnancy,
                    complications
                } = formData;

                let updatedPatient
                if (ageChild < 8) {
                    updatedPatient = await pool.query(
                        `UPDATE assessment_age1_7 SET 
                        height = $1, 
                        weight = $2, 
                        breast_enlargement = $3, 
                        pathological_formations = $4, 
                        abnormalities_structure_external_genitalia = $5, 
                        rostvolos = $6, 
                        pathological_discharge = $7, 
                        hyperemia_skin = $8, 
                        presence_signs_violence = $9,
                        recimendation = $10,
                        reusable_diapers = $11,
                        pediatrician_report = $12,
                        conclusion_pediatric_gynecologist = $13,
                        degree_risk_reproductive_disorders = $14,
                        special_marks = $15
                        WHERE patient_id = $17 and age_value = $16 RETURNING *`,
                        [
                            height, 
                            weight,
                            breast_enlargement, 
                            pathological_formations,
                            abnormalities_structure_external_genitalia,
                            rostvolos,
                            pathological_discharge,
                            hyperemia_skin,
                            presence_signs_violence,
                            recimendation,
                            reusable_diapers,
                            pediatrician_report,
                            conclusion_pediatric_gynecologist,
                            degree_risk_reproductive_disorders,
                            special_marks,
                            ageChild,
                            req.params.id
                        ]
                    );
                } else if (ageChild < 12 && ageChild > 7) {
                    updatedPatient = await pool.query(
                        `UPDATE assessment_age8_11 SET 
                        height = $1, 
                        weight = $2, 
                        bad_habits = $3, 
                        sexual_characteristics = $4, 
                        pathological_formations = $5, 
                        rhythm_features = $6, 
                        hair_growth = $7, 
                        presence_stripes = $8, 
                        presence_acne = $9,
                        structure_external_genitalia = $10,
                        abnormalities_structure = $11,
                        pathological_discharge = $12,
                        hyperemia_skin = $13,
                        nocturnal_enuresis = $14,
                        daytime_incontinence = $15,
                        stress_incontinence = $16,
                        presence_stains = $17,
                        complaints_pain = $18,
                        presence_signs_violence = $19,
                        recimendation = $20,
                        uterus = $21,
                        appendages = $22,
                        vaginoscopy = $23,
                        condition_vagina = $24,
                        condition_cervix = $25,
                        gynecologist_report = $26,
                        degree_risk = $27,
                        pediatrician_report = $28,
                        conclusion_pediatric_gynecologist = $29,
                        degree_risk_reproductive_disorders = $30,
                        special_marks = $31
                        WHERE patient_id = $33 and age_value = $32 RETURNING *`,
                        [
                            height,
                            weight,
                            bad_habits,
                            sexual_characteristics,
                            pathological_formations,
                            rhythm_features,
                            hair_growth,
                            presence_stripes,
                            presence_acne,
                            structure_external_genitalia,
                            abnormalities_structure,
                            pathological_discharge,
                            hyperemia_skin,
                            nocturnal_enuresis,
                            daytime_incontinence,
                            stress_incontinence,
                            presence_stains,
                            complaints_pain,
                            presence_signs_violence,
                            recimendation,
                            uterus,
                            appendages,
                            vaginoscopy,
                            condition_vagina,
                            condition_cervix,
                            gynecologist_report,
                            degree_risk,
                            pediatrician_report,
                            conclusion_pediatric_gynecologist,
                            degree_risk_reproductive_disorders,
                            special_marks,
                            ageChild,
                            req.params.id
                        ]
                    );
                } else {
                    updatedPatient = await pool.query(
                        `UPDATE assessment_age12_18 SET 
                        height = $1, 
                        weight = $2, 
                        bad_habits = $3, 
                        sexual_characteristics = $4, 
                        pathological_formations = $5, 
                        rhythm_features = $6, 
                        hair_growth = $7, 
                        presence_stripes = $8, 
                        presence_acne = $9,
                        structure_external_genitalia = $10,
                        abnormalities_structure = $11,
                        pathological_discharge = $12,
                        hyperemia_skin = $13,
                        nocturnal_enuresis = $14,
                        daytime_incontinence = $15,
                        stress_incontinence = $16,
                        presence_stains = $17,
                        complaints_pain = $18,
                        presence_signs_violence = $19,
                        recimendation = $20,
                        uterus = $21,
                        appendages = $22,
                        vaginoscopy = $23,
                        condition_vagina = $24,
                        condition_cervix = $25,
                        sex = $26,
                        number_partners = $27,
                        contraception = $28,
                        motivation = $29,
                        pregnancy = $30,
                        complications = $31,
                        gynecologist_report = $32,
                        degree_risk_reproductive_disorders = $33,
                        special_marks = $34,
                        pediatrician_report = $35,
                        conclusion_pediatric_gynecologist = $36
                        WHERE patient_id = $38 and age_value = $37 RETURNING *`,
                        [
                            height,
                            weight,
                            bad_habits,
                            sexual_characteristics,
                            pathological_formations,
                            rhythm_features,
                            hair_growth,
                            presence_stripes,
                            presence_acne,
                            structure_external_genitalia,
                            abnormalities_structure,
                            pathological_discharge,
                            hyperemia_skin,
                            nocturnal_enuresis,
                            daytime_incontinence,
                            stress_incontinence,
                            presence_stains,
                            complaints_pain,
                            presence_signs_violence,
                            recimendation,
                            uterus,
                            appendages,
                            vaginoscopy,
                            condition_vagina,
                            condition_cervix,
                            sex,
                            number_partners,
                            contraception,
                            motivation,
                            pregnancy,
                            complications,
                            gynecologist_report,
                            degree_risk_reproductive_disorders,
                            special_marks,
                            pediatrician_report,
                            conclusion_pediatric_gynecologist,
                            ageChild,
                            req.params.id
                        ]
                    );
                }
                
                if (updatedPatient.rows.length === 0) {
                    return res.status(404).json({ message: 'Пациент не найден' });
                }
                res.json(updatedPatient.rows[0]);
            }   else if (type === 'GeneralСonclusion') {
                const { formData } = req.body;
                const { 
                    assessment_physical_development,
                    assessment_dynamics_sexual_development,
                    rate_sexual_development,
                    presence_gynecological_diseases_anamnesis,
                    presence_chronic_extragenital_diseases,
                    health_group,
                    final_gynecological_diagnosis,
                    risk_factors_development,
                    recommendations_prevention_treatment,
                } = formData;
                const updatedPatient = await pool.query(
                    `UPDATE general_conclusion SET 
                    assessment_physical_development = $1, 
                    assessment_dynamics_sexual_development = $2, 
                    rate_sexual_development = $3, 
                    presence_gynecological_diseases_anamnesis = $4, 
                    presence_chronic_extragenital_diseases = $5, 
                    health_group = $6, 
                    final_gynecological_diagnosis = $7, 
                    risk_factors_development = $8, 
                    recommendations_prevention_treatment = $9
                    WHERE patient_id = $10 RETURNING *`,
                    [
                        assessment_physical_development,
                        assessment_dynamics_sexual_development,
                        rate_sexual_development,
                        presence_gynecological_diseases_anamnesis,
                        presence_chronic_extragenital_diseases,
                        health_group,
                        final_gynecological_diagnosis,
                        risk_factors_development,
                        recommendations_prevention_treatment,
                        req.params.id
                    ]
                );
                if (updatedPatient.rows.length === 0) {
                    return res.status(404).json({ message: 'Пациент не найден' });
                }
                res.json(updatedPatient.rows[0]);
            }   else {
                const updatedPatient = await pool.query(
                    'UPDATE patients SET name = $1, patronymic = $2, surname = $3, birth_date = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
                    [name, patronymic, surname, birth_date, req.params.id]
                );

                if (updatedPatient.rows.length === 0) {
                    return res.status(404).json({ message: 'Пациент не найден' });
                }

                res.json(updatedPatient.rows[0]);
            }
        } catch (error) {
            console.error('Error updating patient:', error);
            res.status(500).json({ message: 'Ошибка при обновлении данных пациента' });
        }
    }
);
// Обновить данные пользователя
app.put('/api/users/:id',
    authenticateToken,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const updatedPatient = await pool.query(
                `UPDATE users SET 
                active = true
                WHERE id = $1 RETURNING *`,
                [
                    req.params.id
                ]
            );
            if (updatedPatient.rows.length === 0) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }
            res.json(updatedPatient.rows[0]);
        } catch (error) {
            console.error('Error updating patient:', error);
            res.status(500).json({ message: 'Ошибка при обновлении данных пациента' });
        }
    }
);
// Удалить пациента
app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM patients WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пациент не найден' });
        }

        res.json({ message: 'Пациент успешно удален' });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ message: 'Ошибка при удалении пациента' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
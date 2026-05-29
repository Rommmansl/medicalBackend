-- CREATE DATABASE postgres;

-- \c postgres;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role TEXT DEFAULT 'user',
    active boolean DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS list_diseases (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    disease_group INTEGER,
    disease_name TEXT,
    disease_group_name TEXT
);

CREATE TABLE IF NOT EXISTS list_diseases_gynecologica (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    disease_group INTEGER,
    disease_name TEXT
);

CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    -- Общие поля для отца и матери
    parent_type VARCHAR(6) CHECK (parent_type IN ('father', 'mother')),
    -- Физические данные
    height TEXT,
    weight TEXT,
    physique INTEGER,
    -- Вредные привычки и заболевания
    prof_damage_child_text TEXT,
    bad_habits_variant TEXT,
    special_diseas_text TEXT,
    relative_special_diseas_text TEXT,
    indirect_signs_endocrine_imbalance TEXT,
    ippp TEXT,
    infertility TEXT,
    method_conception_child TEXT,
    age_time_birth_child INTEGER,
    -- Специфические поля для отца
    pathology_genital_organs TEXT,
    operation_sexual_organ TEXT,
    special_notes TEXT,
    -- Специфические поля для матери
    menstrual_cycle TEXT,
    previous_gynecological_diseases TEXT,
    previous_chemotherapy_therapy TEXT,
    gynecological_operation TEXT,
    contraception_eve_pregnancy TEXT,
    pregnancy TEXT,
    attempt_terminate_pregnancy TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS intrauterine_development (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    toxicosis_first_half_pregnancy TEXT,
    toxicosis_second_half_pregnancy TEXT,
    signs_threatened_termination_pregnancy TEXT,
    acute_diseases_surgical_interventions_mother TEXT,
    use_hormonal_drugs_mother TEXT,
    signs_fetal_suffering TEXT,
    born_week_pregnancy INTEGER,
    childbirth TEXT,
    special_marks_development TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newborn_period (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    height TEXT,
    weight TEXT,
    estimate_apgar TEXT,
    condition TEXT,
    trauma TEXT,
    dysembriogenesis TEXT,
    abnormalities_structure_condition_mammary_glands TEXT,
    abnormalities_structure_external_genitalia TEXT,
    postponed_operations TEXT,
    bcg TEXT,
    discharged_from_maternity_hospital INTEGER,
    she_department_physiology TEXT,
    transferred_children_hospital INTEGER,
    she_took_hormonal_medications TEXT,
    degree_risk_reproductive_disorders TEXT,
    special_marks_recommendations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_age1_7 (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    age_value INTEGER CHECK (age_value BETWEEN 1 AND 7),
    height TEXT,
    weight TEXT,
    breast_enlargement TEXT,
    pathological_formations TEXT,
    abnormalities_structure_external_genitalia TEXT,
    rostvolos TEXT,
    pathological_discharge TEXT,
    hyperemia_skin TEXT,
    presence_signs_violence INTEGER,
    recimendation TEXT,
    reusable_diapers TEXT,
    pediatrician_report INTEGER,
    conclusion_pediatric_gynecologist TEXT,
    degree_risk_reproductive_disorders INTEGER,
    special_marks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_age8_11 (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    age_value INTEGER CHECK (age_value BETWEEN 8 AND 11),
    height TEXT,
    weight TEXT,
    bad_habits TEXT,
    sexual_characteristics TEXT,
    pathological_formations TEXT,
    rhythm_features TEXT,
    hair_growth TEXT,
    presence_stripes TEXT,
    presence_acne TEXT,
    structure_external_genitalia TEXT,
    abnormalities_structure TEXT,
    pathological_discharge TEXT,
    hyperemia_skin TEXT,
    nocturnal_enuresis INTEGER,
    daytime_incontinence INTEGER,
    stress_incontinence INTEGER,
    presence_stains INTEGER,
    complaints_pain INTEGER,
    presence_signs_violence INTEGER,
    recimendation TEXT,
    uterus TEXT,
    appendages TEXT,
    vaginoscopy TEXT,
    condition_vagina TEXT,
    condition_cervix TEXT,
    gynecologist_report TEXT,
    degree_risk TEXT,
    pediatrician_report INTEGER,
    conclusion_pediatric_gynecologist TEXT,
    degree_risk_reproductive_disorders INTEGER,
    special_marks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_age12_18 (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    age_value INTEGER CHECK (age_value BETWEEN 12 AND 18),
    height TEXT,
    weight TEXT,
    bad_habits TEXT,
    sexual_characteristics TEXT,
    pathological_formations TEXT,
    rhythm_features TEXT,
    hair_growth TEXT,
    presence_stripes TEXT,
    presence_acne TEXT,
    structure_external_genitalia TEXT,
    abnormalities_structure TEXT,
    pathological_discharge TEXT,
    hyperemia_skin TEXT,
    nocturnal_enuresis INTEGER,
    daytime_incontinence INTEGER,
    stress_incontinence INTEGER,
    presence_stains INTEGER,
    complaints_pain INTEGER,
    presence_signs_violence INTEGER,
    recimendation TEXT,
    uterus TEXT,
    appendages TEXT,
    vaginoscopy TEXT,
    condition_vagina TEXT,
    condition_cervix TEXT,
    sex INTEGER,
    number_partners INTEGER,
    contraception TEXT,
    motivation INTEGER,
    pregnancy TEXT,
    complications TEXT,
    gynecologist_report TEXT,
    degree_risk_reproductive_disorders TEXT,
    special_marks TEXT,
    pediatrician_report INTEGER,
    conclusion_pediatric_gynecologist TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS general_conclusion (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    assessment_physical_development INTEGER,
    assessment_dynamics_sexual_development TEXT,
    rate_sexual_development INTEGER,
    presence_gynecological_diseases_anamnesis TEXT,
    presence_chronic_extragenital_diseases TEXT,
    health_group INTEGER,
    final_gynecological_diagnosis TEXT,
    risk_factors_development TEXT,
    recommendations_prevention_treatment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    surname VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    patronymic VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(255),
    index VARCHAR(50),
    phone VARCHAR(50),
    polis_index VARCHAR(50),
    polis_company VARCHAR(255),
    polis_date DATE,
    social_status INTEGER,
    social_status_text TEXT,
    special_marks TEXT,
    physical_development_workshop INTEGER,
    assessment_dynamics_sexual_development TEXT,
    presence_gynecological_diseases_anamnesis TEXT,
    presence_chronic_extragenital_diseases TEXT,
    group_health INTEGER,
    final_gynecological_diagnosis TEXT,
    factors_risk TEXT,
    prevention_recommendations TEXT,
    -- Внешние ключи
    list_diseases_id INTEGER,
    list_diseases_gynecologica_id INTEGER,
    parents_id INTEGER,
    intrauterine_development_id INTEGER,
    newborn_period_id INTEGER,
    general_conclusion_id integer,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Внешние ключи
    CONSTRAINT fk_patients_list_diseases 
        FOREIGN KEY (list_diseases_id) REFERENCES list_diseases(id) ON DELETE SET NULL,
    CONSTRAINT fk_patients_list_diseases_gynecologica 
        FOREIGN KEY (list_diseases_gynecologica_id) REFERENCES list_diseases_gynecologica(id) ON DELETE SET NULL,
    CONSTRAINT fk_patients_parents 
        FOREIGN KEY (parents_id) REFERENCES parents(id) ON DELETE SET NULL,
    CONSTRAINT fk_patients_intrauterine 
        FOREIGN KEY (intrauterine_development_id) REFERENCES intrauterine_development(id) ON DELETE SET NULL,
    CONSTRAINT fk_patients_newborn 
        FOREIGN KEY (newborn_period_id) REFERENCES newborn_period(id) ON DELETE SET NULL,
    CONSTRAINT fk_patients_general 
        FOREIGN KEY (general_conclusion_id) REFERENCES general_conclusion(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS patient_development_assessments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessment_type VARCHAR(20) NOT NULL, -- 'age1', 'age2', 'age3'
    assessment_id INTEGER NOT NULL,
    age_value INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_assessment_age1 
        FOREIGN KEY (assessment_id) REFERENCES assessment_age1_7(id) ON DELETE CASCADE,
    CONSTRAINT fk_patient_assessment_age2 
        FOREIGN KEY (assessment_id) REFERENCES assessment_age8_11(id) ON DELETE CASCADE,
    CONSTRAINT fk_patient_assessment_age3 
        FOREIGN KEY (assessment_id) REFERENCES assessment_age12_18(id) ON DELETE CASCADE
);

ALTER TABLE list_diseases ADD CONSTRAINT fk_list_diseases_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE list_diseases_gynecologica ADD CONSTRAINT fk_list_diseases_gynecologica_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE parents ADD CONSTRAINT fk_parents_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE intrauterine_development ADD CONSTRAINT fk_intrauterine_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE newborn_period ADD CONSTRAINT fk_newborn_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE general_conclusion ADD CONSTRAINT fk_general_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE assessment_age1_7 ADD CONSTRAINT fk_assessment_age1_7_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE assessment_age8_11 ADD CONSTRAINT fk_assessment_age8_11_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE assessment_age12_18 ADD CONSTRAINT fk_assessment_age12_18_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

CREATE INDEX idx_list_diseases_patient_id ON list_diseases(patient_id);
CREATE INDEX idx_list_diseases_group ON list_diseases(disease_group);
CREATE INDEX idx_list_diseases_gynecologica_patient_id ON list_diseases_gynecologica(patient_id);
CREATE INDEX idx_parents_patient_id ON parents(patient_id);
CREATE INDEX idx_parents_type ON parents(parent_type);
CREATE INDEX idx_intrauterine_patient_id ON intrauterine_development(patient_id);
CREATE INDEX idx_newborn_patient_id ON newborn_period(patient_id);
CREATE INDEX idx_general_patient_id ON general_conclusion(patient_id);
CREATE INDEX idx_assessment_age1_7_patient ON assessment_age1_7(patient_id);
CREATE INDEX idx_assessment_age1_7_value ON assessment_age1_7(age_value);
CREATE INDEX idx_assessment_age8_11_patient ON assessment_age8_11(patient_id);
CREATE INDEX idx_assessment_age8_11_value ON assessment_age8_11(age_value);
CREATE INDEX idx_assessment_age12_18_patient ON assessment_age12_18(patient_id);
CREATE INDEX idx_assessment_age12_18_value ON assessment_age12_18(age_value);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_age1_7_updated_at 
    BEFORE UPDATE ON assessment_age1_7 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_age8_11_updated_at 
    BEFORE UPDATE ON assessment_age8_11 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_age12_18_updated_at 
    BEFORE UPDATE ON assessment_age12_18 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION get_patient_age(p_birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, p_birth_date));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW patient_complete_info AS
SELECT 
    p.*,
    u.email as created_by_email,
    COALESCE(d.diseases, ARRAY[]::jsonb[]) as diseases,
    COALESCE(g.gynecological_diseases, ARRAY[]::jsonb[]) as gynecological_diseases,
    jsonb_build_object(
        'father', jsonb_build_object(
            'height', f.height,
            'weight', f.weight,
            'physique', f.physique,
            'bad_habits', f.bad_habits_variant,
            'age_at_birth', f.age_time_birth_child
        ),
        'mother', jsonb_build_object(
            'height', m.height,
            'weight', m.weight,
            'physique', m.physique,
            'bad_habits', m.bad_habits_variant,
            'menstrual_cycle', m.menstrual_cycle,
            'age_at_birth', m.age_time_birth_child
        )
    ) as parents_info,
    (SELECT row_to_json(iud) FROM intrauterine_development iud WHERE iud.patient_id = p.id LIMIT 1) as intrauterine_development,
    (SELECT row_to_json(np) FROM newborn_period np WHERE np.patient_id = p.id LIMIT 1) as newborn_period,
    (SELECT row_to_json(gp) FROM general_conclusion gp WHERE gp.patient_id = p.id LIMIT 1) as general_conclusion,
    COALESCE(da.development_assessments, ARRAY[]::jsonb[]) as development_assessments
FROM patients p
LEFT JOIN users u ON p.created_by = u.id
LEFT JOIN LATERAL (
    SELECT 
        MAX(height) as height,
        MAX(weight) as weight,
        MAX(physique) as physique,
        MAX(bad_habits_variant) as bad_habits_variant,
        MAX(age_time_birth_child) as age_time_birth_child
    FROM parents 
    WHERE patient_id = p.id AND parent_type = 'father'
    GROUP BY patient_id
) f ON true
LEFT JOIN LATERAL (
    SELECT 
        MAX(height) as height,
        MAX(weight) as weight,
        MAX(physique) as physique,
        MAX(bad_habits_variant) as bad_habits_variant,
        MAX(menstrual_cycle) as menstrual_cycle,
        MAX(age_time_birth_child) as age_time_birth_child
    FROM parents 
    WHERE patient_id = p.id AND parent_type = 'mother'
    GROUP BY patient_id
) m ON true
LEFT JOIN LATERAL (
    SELECT array_agg(DISTINCT jsonb_build_object(
        'disease_group', ld.disease_group,
        'disease_name', ld.disease_name,
        'group_name', ld.disease_group_name
    )) as diseases
    FROM list_diseases ld
    WHERE ld.patient_id = p.id
) d ON true
LEFT JOIN LATERAL (
    SELECT array_agg(DISTINCT jsonb_build_object(
        'disease_group', ldg.disease_group,
        'disease_name', ldg.disease_name
    )) as gynecological_diseases
    FROM list_diseases_gynecologica ldg
    WHERE ldg.patient_id = p.id
) g ON true
LEFT JOIN LATERAL (
    SELECT array_agg(DISTINCT jsonb_build_object(
        'age_group', age_group,
        'age', age_value,
        'data', assessment_data
    )) as development_assessments
    FROM (
        SELECT 
            '1-7' as age_group,
            a17.age_value,
            to_jsonb(a17.*) as assessment_data
        FROM assessment_age1_7 a17
        WHERE a17.patient_id = p.id
        
        UNION ALL
        
        SELECT 
            '8-11' as age_group,
            a811.age_value,
            to_jsonb(a811.*) as assessment_data
        FROM assessment_age8_11 a811
        WHERE a811.patient_id = p.id
        
        UNION ALL
        
        SELECT 
            '12-18' as age_group,
            a1218.age_value,
            to_jsonb(a1218.*) as assessment_data
        FROM assessment_age12_18 a1218
        WHERE a1218.patient_id = p.id
    ) assessments
) da ON true;
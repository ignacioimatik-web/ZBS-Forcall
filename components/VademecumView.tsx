import React, { useState } from 'react';

interface Drug {
  id: string;
  name: string;
  category: string;
  indications: string;
  contraindications: string;
  adultDosing: string;
  pediatricDosing: string;
  presentation: string;
  notes: string;
}

const DRUGS: Drug[] = [
  { id: 'paracetamol', name: 'Paracetamol', category: 'Analgésico / Antitérmico', indications: 'Fiebre, dolor leve-moderado', contraindications: 'Insuficiencia hepática grave', adultDosing: '500-1000 mg/6-8h (max 4g/día)', pediatricDosing: '15 mg/kg/dosis cada 6-8h (max 60 mg/kg/día)', presentation: 'Comp 500/650mg; Sol 100mg/ml; Sup 150/300/600mg', notes: 'Antídoto: N-acetilcisteína. Evitar en hepatopatía.' },
  { id: 'ibuprofeno', name: 'Ibuprofeno', category: 'AINE', indications: 'Fiebre, dolor leve-moderado, inflamación', contraindications: 'Insuficiencia renal, úlcera péptica activa, asma sensible a AINE', adultDosing: '400-600 mg/6-8h (max 2400 mg/día)', pediatricDosing: '7.5-10 mg/kg/dosis cada 6-8h (max 30 mg/kg/día)', presentation: 'Comp 400/600mg; Sobres 100/200/400mg; Sol 100mg/ml', notes: 'Tomar con alimentos. No asociar con otros AINE.' },
  { id: 'amoxicilina', name: 'Amoxicilina', category: 'Antibiótico (β-lactámico)', indications: 'Infecciones ORL, respiratorias, urinarias, odontogénicas', contraindications: 'Alergia a penicilinas, mononucleosis infecciosa', adultDosing: '500-875 mg/8h', pediatricDosing: '80 mg/kg/día c/8h (max 3g/día)', presentation: 'Comp 500/750/1000mg; Sobres 250/500mg; Sol 100mg/ml', notes: 'Tomar con o sin alimentos. Curso mínimo 5-7 días.' },
  { id: 'amoxicilina-clav', name: 'Amoxicilina-clavulánico', category: 'Antibiótico (β-lactámico + inhibidor)', indications: 'Infecciones ORL, respiratorias, urinarias complicadas, mordeduras', contraindications: 'Alergia a penicilinas, insuficiencia hepática', adultDosing: '500/125mg c/8h o 875/125mg c/12h', pediatricDosing: '80 mg/kg/día de amoxicilina c/8h (max 3g/día)', presentation: 'Comp 500/125mg, 875/125mg; Sobres 250/31.25mg, 500/62.5mg; Sol 100/12.5mg/ml', notes: 'Tomar con alimentos para reducir molestias GI.' },
  { id: 'salbutamol', name: 'Salbutamol', category: 'Broncodilatador (β2-agonista)', indications: 'Asma, EPOC, crisis broncoespástica', contraindications: 'Taquiarritmias. Precaución en hipertiroidismo e HTA', adultDosing: '2 inhalaciones (200mcg) c/4-6h; crisis: 4 inhalaciones c/20min', pediatricDosing: '1-2 inhalaciones (100-200mcg) c/4-6h; crisis: 2-4 inhalaciones c/20min', presentation: 'Inhalador 100mcg/inh; Sol nebulizar 5mg/ml', notes: 'Enjuagar boca tras inhalación. Efectos: taquicardia, temblor.' },
  { id: 'budesonida', name: 'Budesonida', category: 'Corticoide inhalado', indications: 'Asma persistente, EPOC, crup', contraindications: 'No indicado en crisis aguda grave', adultDosing: '200-800 mcg/día en 1-2 dosis', pediatricDosing: '200-400 mcg/día en 1-2 dosis', presentation: 'Inhalador 200mcg/inh; Nebulizar 0.25/0.5mg/ml', notes: 'Enjuagar boca tras uso. Efecto máximo a los 7-14 días.' },
  { id: 'prednisona', name: 'Prednisona / Prednisolona', category: 'Corticoide sistémico', indications: 'Crisis asma, reacciones alérgicas, enfermedades inflamatorias', contraindications: 'Infección sistémica activa no tratada', adultDosing: '30-60 mg/día en pauta descendente', pediatricDosing: '1-2 mg/kg/día (max 60mg/día) 3-5 días', presentation: 'Comp 5/10/30mg; Sol 1mg/ml', notes: 'No suspender bruscamente en tratamientos prolongados.' },
  { id: 'diazepam', name: 'Diazepam', category: 'Benzodiazepina', indications: 'Ansiedad, convulsiones, espasmos musculares, síndrome abstinencia alcohólica', contraindications: 'Insuficiencia respiratoria grave, miastenia gravis, glaucoma', adultDosing: '5-10 mg/8-12h', pediatricDosing: '0.3-0.5 mg/kg/dosis (convulsiones: rectal 0.5 mg/kg)', presentation: 'Comp 5/10mg; Sol 2mg/ml; Rectioles 5/10mg', notes: 'Riesgo de dependencia. Efecto sedante prolongado.' },
  { id: 'adrenalina', name: 'Adrenalina (Epinefrina)', category: 'Simpaticomimético', indications: 'Anafilaxia, parada cardiorrespiratoria, shock anafiláctico', contraindications: 'Precaución en HTA, cardiopatía isquémica, hipertiroidismo', adultDosing: '0.3-0.5 mg IM (anafilaxia); 1mg IV cada 3-5min (PCR)', pediatricDosing: '0.01 mg/kg IM (max 0.3mg) en anafilaxia', presentation: 'Ampolla 1mg/ml; Autoinyector 0.15/0.3mg', notes: 'Vía IM en anafilaxia (cara externa muslo). Repetir c/5-15min.' },
  { id: 'ceftriaxona', name: 'Ceftriaxona', category: 'Antibiótico (cefalosporina 3G)', indications: 'Infecciones graves: neumonía, meningitis, sepsis, ITU complicada', contraindications: 'Alergia a cefalosporinas. Precaución si alergia a penicilinas', adultDosing: '1-2 g/día IM/IV', pediatricDosing: '50-100 mg/kg/día IM/IV (max 4g/día)', presentation: 'Viales 250/500mg, 1/2g', notes: 'No asociar con calcio en neonatos. Excreción biliar y renal.' },
  { id: 'azitromicina', name: 'Azitromicina', category: 'Antibiótico (macrólido)', indications: 'Infecciones respiratorias, ORL, cutáneas, ETS', contraindications: 'Alergia a macrólidos. Precaución en cardiopatía (QT largo)', adultDosing: '500 mg/día 3 días', pediatricDosing: '10 mg/kg/día 3 días', presentation: 'Comp 250/500mg; Sobres 250/500mg; Sol 40mg/ml', notes: 'Tomar 1h antes o 2h después de comidas. Interacción con anticoagulantes.' },
  { id: 'omeprazol', name: 'Omeprazol', category: 'IBP (Inhibidor bomba protones)', indications: 'ERGE, úlcera péptica, profilaxis gastropatía por AINE, H. pylori', contraindications: 'Hipomagnesemia, uso prolongado sin indicación', adultDosing: '20-40 mg/día', pediatricDosing: '1 mg/kg/día (max 20mg/día)', presentation: 'Comp 20mg; Cáps 20/40mg; Sobres 10/20mg', notes: 'Tomar en ayunas 30-60min antes del desayuno.' },
  { id: 'ondansetron', name: 'Ondansetrón', category: 'Antiemético (antagonista 5-HT3)', indications: 'Náuseas y vómitos, profilaxis quimioterapia, postoperatorio', contraindications: 'Intervalo QT largo, hipersensibilidad', adultDosing: '4-8 mg/8h', pediatricDosing: '0.15 mg/kg/dosis c/8h (max 8mg/dosis)', presentation: 'Comp 4/8mg; Sol 2mg/ml; Viales 4/8mg', notes: 'Puede prolongar QT. Efecto: cefalea, estreñimiento.' },
  { id: 'furosemida', name: 'Furosemida', category: 'Diurético de asa', indications: 'Edema, insuficiencia cardíaca, HTA, ascitis', contraindications: 'Insuficiencia renal anúrica, hipopotasemia grave, deshidratación', adultDosing: '20-80 mg/día', pediatricDosing: '1-2 mg/kg/dosis', presentation: 'Comp 40mg; Sol 10mg/ml; Viales 20mg', notes: 'Controlar K+ y creatinina. Fotosensibilidad.' },
  { id: 'enalapril', name: 'Enalapril', category: 'IECA (Inhibidor ECA)', indications: 'HTA, insuficiencia cardíaca, nefropatía diabética', contraindications: 'Embarazo, estenosis arterial renal bilateral, angioedema previo por IECA', adultDosing: '5-20 mg/día', pediatricDosing: '0.08 mg/kg/día (max 0.6 mg/kg/día)', presentation: 'Comp 5/10/20mg', notes: 'Controlar TA, K+, creatinina al inicio. No en embarazo.' },
  { id: 'amitriptilina', name: 'Amitriptilina', category: 'Antidepresivo (tricíclico)', indications: 'Depresión, dolor neuropático, migraña profilaxis, enuresis nocturna', contraindications: 'IAM reciente, arritmias, glaucoma, hiperplasia prostática', adultDosing: '25-75 mg/día (dolor neuropático 10-50 mg/día)', pediatricDosing: '0.5-1 mg/kg/día (enuresis: 25-50 mg al acostarse)', presentation: 'Comp 10/25/50/75mg; Sol 10mg/ml', notes: 'Tomar por la noche. Riesgo de arritmias en sobredosis.' },
  { id: 'hioscina', name: 'Butilhioscina (Buscapina)', category: 'Antiespasmódico', indications: 'Cólico abdominal, espasmos gastrointestinales, dismenorrea', contraindications: 'Glaucoma, miastenia gravis, hipertrofia prostática, estenosis pilórica', adultDosing: '10-20 mg/6-8h', pediatricDosing: '5-10 mg/6-8h (>6 años)', presentation: 'Comp 10mg; Sol 10mg/ml; Sup 10mg', notes: 'No recomendado en <6 años. Puede causar sequedad boca.' },
  { id: 'aciclovir', name: 'Aciclovir', category: 'Antiviral', indications: 'Herpes simple, herpes zóster, varicela', contraindications: 'Hipersensibilidad', adultDosing: '200-800 mg/4-8h', pediatricDosing: '20 mg/kg/dosis c/6h (varicela: 80 mg/kg/día 5 días)', presentation: 'Comp 200/400/800mg; Sol 40mg/ml; Crema 5%', notes: 'Ajustar en insuficiencia renal. Ingerir abundante agua.' },
  { id: 'metamizol', name: 'Metamizol (Nolotil)', category: 'Analgésico / Antitérmico', indications: 'Dolor agudo moderado-severo, fiebre alta refractaria', contraindications: 'Agranulocitosis, alergia a pirazolonas, porfiria hepática, embarazo 3T', adultDosing: '500-1000 mg/6-8h (max 4g/día)', pediatricDosing: '10-15 mg/kg/dosis c/6-8h (max 40 mg/kg/día)', presentation: 'Cáps 500mg; Sobres 500mg/1g; Sol 500mg/ml; Sup 300/500mg', notes: 'Riesgo de agranulocitosis (1:1M). No usar >7 días.' },
  { id: 'hierro', name: 'Hierro (Sulfato ferroso)', category: 'Antianémico', indications: 'Anemia ferropénica, profilaxis en lactantes y embarazo', contraindications: 'Hemocromatosis, sobrecarga férrica, anemia hemolítica', adultDosing: '100-200 mg Fe/día', pediatricDosing: '3-6 mg Fe/kg/día', presentation: 'Comp 40/80mg Fe; Sol 25mg Fe/ml; Gotas 25mg Fe/ml', notes: 'Tomar en ayunas con Vit C. Coloración oscura heces.' },
  { id: 'insulina', name: 'Insulina (acción rápida)', category: 'Antidiabético', indications: 'Diabetes tipo 1, descompensación hiperglucémica, hiperpotasemia', contraindications: 'Hipoglucemia', adultDosing: 'Dosis variable según perfil. 0.5-1 U/kg/día', pediatricDosing: '0.5-1 U/kg/día en múltiples dosis', presentation: 'Plumas 100U/ml; Viales 100U/ml', notes: 'Vía SC. Rotar puntos de inyección. Hipoglucemia: glucosa 15g VO.' },
  { id: 'naloxona', name: 'Naloxona', category: 'Antídoto (antagonista opioide)', indications: 'Sobredosis de opioides, depresión respiratoria por opioides', contraindications: 'No contraindicada en emergencia. Precaución en dependencia física a opioides', adultDosing: '0.4-2 mg IV/IM, repetir c/2-3min', pediatricDosing: '0.1 mg/kg IV/IM (max 2mg por dosis)', presentation: 'Viales 0.4mg/ml; 1mg/ml', notes: 'Vida media corta (30-90min). Pueden requerirse dosis repetidas.' },
  { id: 'flumazenilo', name: 'Flumazenilo', category: 'Antídoto (antagonista benzodiazepinas)', indications: 'Sobredosis de benzodiazepinas, reversión de sedación', contraindications: 'Epilepsia tratada con BZD, hipertensión intracraneal', adultDosing: '0.2 mg IV, repetir 0.1mg/min (max 1mg)', pediatricDosing: '0.01 mg/kg IV (max 0.2mg), repetir c/1min (max 0.05mg/kg)', presentation: 'Viales 0.5mg/5ml; 1mg/10ml', notes: 'Vida media corta. Pueden resurgir efectos de BZD.' },
  { id: 'loratadina', name: 'Loratadina', category: 'Antihistamínico H1 (2ª gen)', indications: 'Rinitis alérgica, urticaria, conjuntivitis alérgica', contraindications: 'Hipersensibilidad', adultDosing: '10 mg/día', pediatricDosing: '5 mg/día (2-12 años); >12 años: 10 mg/día', presentation: 'Comp 10mg; Sol 5mg/5ml', notes: 'No produce somnolencia significativa.' },
  { id: 'diclofenaco', name: 'Diclofenaco', category: 'AINE', indications: 'Dolor musculoesquelético, artritis, gota, cólico nefrítico', contraindications: 'Asma sensible a AINE, úlcera activa, insuficiencia cardiaca grave', adultDosing: '50 mg/8h (max 150mg/día)', pediatricDosing: '1-3 mg/kg/día c/8h (>1 año)', presentation: 'Comp 50mg; Sobres 50mg; Amp 75mg; Gel 1%', notes: 'Riesgo cardiovascular elevado. No en embarazo 3T.' },
];

type CalculatorTab = 'paracetamol' | 'ibuprofeno' | 'amoxicilina' | 'imc' | 'holliday' | 'talla';

const CalculatorForm: React.FC<{ calc: CalculatorTab }> = ({ calc }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    switch (calc) {
      case 'paracetamol': {
        if (!w) return;
        const dosis = w * 15;
        const dosisMax = Math.min(dosis, 1000);
        const dia = Math.min(w * 60, 4000);
        setResult(`Dosis: ${dosisMax.toFixed(0)} mg cada 6-8h\nMáximo diario: ${dia.toFixed(0)} mg\nPresentación: ${dosisMax <= 150 ? '3-5 ml solución' : dosisMax <= 500 ? '1 comp 500mg' : '1 comp 650mg + 1 comp 500mg o 2 comp 650mg'}`);
        return;
      }
      case 'ibuprofeno': {
        if (!w) return;
        const dosis = w * 7.5;
        const dosisMax = Math.min(dosis, 600);
        const dia = Math.min(w * 30, 2400);
        setResult(`Dosis: ${dosisMax.toFixed(0)} mg cada 6-8h\nMáximo diario: ${dia.toFixed(0)} mg\nPresentación: ${dosisMax <= 100 ? '1 sobre 100mg o 1 ml solución' : dosisMax <= 200 ? '1 sobre 200mg o 2 ml' : dosisMax <= 400 ? '1 comp 400mg' : '1 comp 600mg'}`);
        return;
      }
      case 'amoxicilina': {
        if (!w) return;
        const dosis = w * 80 / 3;
        setResult(`Dosis habitual: ${dosis.toFixed(0)} mg cada 8h\nTotal diario: ${(w * 80).toFixed(0)} mg/día\nMáximo: ${Math.min(w * 80, 3000).toFixed(0)} mg/día\nPresentación: ${dosis <= 250 ? '2.5-5 ml solución' : dosis <= 500 ? '1 sobre 500mg' : dosis <= 750 ? '1 comp 750mg' : '1 comp 1000mg'}`);
        return;
      }
      case 'imc': {
        if (!w || !height) return;
        const h = parseFloat(height) / 100;
        const imc = w / (h * h);
        let categoria = '';
        if (imc < 18.5) categoria = 'Bajo peso';
        else if (imc < 25) categoria = 'Normopeso';
        else if (imc < 30) categoria = 'Sobrepeso';
        else if (imc < 35) categoria = 'Obesidad grado I';
        else if (imc < 40) categoria = 'Obesidad grado II';
        else categoria = 'Obesidad grado III';
        setResult(`IMC: ${imc.toFixed(1)} kg/m²\nClasificación: ${categoria}`);
        return;
      }
      case 'holliday': {
        if (!w) return;
        const holliday = w <= 10 ? w * 100 : w <= 20 ? 1000 + (w - 10) * 50 : 1500 + (w - 20) * 20;
        setResult(`Necesidades basales: ${holliday.toFixed(0)} ml/día (${(holliday / 24).toFixed(0)} ml/h)\nFórmula: ${w <= 10 ? `100 ml/kg × ${w} kg` : w <= 20 ? `1000 + 50 × (${w} - 10)` : `1500 + 20 × (${w} - 20)`}`);
        return;
      }
      case 'talla': {
        if (!height) return;
        const hcm = parseFloat(height);
        const tallaDiana = (hcm + (calc === 'talla' ? 0 : 0)) / 2;
        setResult(`Talla diana (media parental): ${tallaDiana.toFixed(0)} cm\nRango esperado (±8.5cm): ${(tallaDiana - 8.5).toFixed(0)} - ${(tallaDiana + 8.5).toFixed(0)} cm\n* Para calcular: (talla padre + talla madre) / 2 ± 8.5 cm`);
        return;
      }
    }
  };

  return (
    <div className="space-y-4">
      {calc !== 'talla' && (
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Peso (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ej: 70" className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-forcall-400" />
        </div>
      )}
      {(calc === 'imc' || calc === 'talla') && (
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">{calc === 'imc' ? 'Altura (cm)' : 'Suma tallas padre+madre (cm)'}</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder={calc === 'imc' ? 'Ej: 170' : 'Ej: 340'} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-forcall-400" />
        </div>
      )}
      <button onClick={calculate} className="w-full py-2.5 bg-forcall-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-forcall-700 transition-all">Calcular</button>
      {result && (
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 whitespace-pre-line text-xs font-bold text-gray-700 leading-relaxed">
          {result}
        </div>
      )}
    </div>
  );
};

const calculators: { id: CalculatorTab; title: string; icon: string; desc: string }[] = [
  { id: 'paracetamol', title: 'Paracetamol', icon: 'vaccines', desc: 'Dosis por peso (15 mg/kg/dosis)' },
  { id: 'ibuprofeno', title: 'Ibuprofeno', icon: 'vaccines', desc: 'Dosis por peso (7.5 mg/kg/dosis)' },
  { id: 'amoxicilina', title: 'Amoxicilina', icon: 'medication', desc: 'Dosis por peso (80 mg/kg/día)' },
  { id: 'imc', title: 'Índice de Masa Corporal', icon: 'monitor_weight', desc: 'IMC y clasificación OMS' },
  { id: 'holliday', title: 'Holliday-Segar', icon: 'water_drop', desc: 'Necesidades basales de líquidos' },
  { id: 'talla', title: 'Talla Diana', icon: 'height', desc: 'Talla genética familiar' },
];

const protocols = [
  { id: 'anespirina', title: 'Crisis Asma Pediátrica', icon: 'air', steps: ['Valorar gravedad (leve: SatO2 >95%, moderada: 92-95%, grave: <92%)', 'Oxigenoterapia si SatO2 <94% (mascarilla con reservorio 10-15 L/min)', 'Salbutamol inhalado 2-4 inhalaciones c/20min x3 (o nebulizado 0.15 mg/kg)', 'Si respuesta parcial: añadir bromuro de ipatropio 250 mcg', 'Prednisolona oral 1-2 mg/kg (max 60mg) si moderada-grave', 'Valorar derivación a Urgencias si no mejora tras 3 dosis de salbutamol'], color: 'border-l-sky-500' },
  { id: 'anafilaxia', title: 'Anafilaxia', icon: 'emergency', steps: ['Valorar vía aérea, respiración, circulación (ABC)', 'ADRENALINA IM 0.01 mg/kg (max 0.3mg) en cara externa muslo, repetir c/5-15min', 'Oxígeno a alto flujo', 'Suero fisiológico IV 20 ml/kg en bolo', 'Antihistamínico H1 (dexclorfeniramina 0.2 mg/kg)', 'Corticoide IV (metilprednisolona 1-2 mg/kg)', 'Traslado a Urgencias hospitalarias'], color: 'border-l-red-500' },
  { id: 'crisis-febril', title: 'Crisis Febril', icon: 'thermostat', steps: ['Proteger al niño de lesiones (no sujetar, no meter nada en boca)', 'Posición lateral de seguridad', 'Si dura >5 min: Diazepam rectal 0.5 mg/kg (max 10mg)', 'Oxígeno si cianosis', 'Antitérmicos tras la crisis (no abortan la crisis)', 'Valorar causa de la fiebre', 'Si primera crisis febril compleja: derivar a Urgencias'], color: 'border-l-amber-500' },
  { id: 'deshidratacion', title: 'Deshidratación Pediátrica', icon: 'water_drop', steps: ['Valorar grado: leve (3-5%: sed, mucosa seca), moderada (6-9%: ojos hundidos, pliegue), grave (>10%: shock)', 'Leve: suero rehidratación oral 50 ml/kg en 4h', 'Moderada: SRO 100 ml/kg en 4-6h, en pequeñas tomas frecuentes', 'Grave: Suero fisiológico IV 20 ml/kg en bolo, repetir si precisa', 'Reevaluar cada 30-60 minutos', 'Si vómitos: pauta de cucharaditas 5-10 ml cada 5 min'], color: 'border-l-blue-500' },
  { id: 'bronquiolitis', title: 'Bronquiolitis', icon: 'lungs', steps: ['Criterios: <12 meses, primer episodio de sibilancias/disnea en contexto catarral', 'Valorar gravedad: frecuencia respiratoria, SatO2, alimentación, signos de dificultad respiratoria', 'Posición semisentada, aspirar secreciones nasales con frecuencia', 'Oxígeno si SatO2 <92% de forma mantenida', 'No nebulizar salbutamol de forma rutinaria (valorar si fenotipo atópico)', 'CRITERIOS DERIVACIÓN: SatO2 <92%, FR >60 rpm, rechazo alimentario >50%, apnea'], color: 'border-l-teal-500' },
  { id: 'meningitis', title: 'Sospecha Meningitis', icon: 'psychiatry', steps: ['SIGNOS: fiebre + rigidez nuca + alteración consciencia + petequias', 'Lactante: fontanela abombada, irritabilidad, quejido, rechazo del alimento', 'ABC + oxígeno', 'Acceso venoso, analítica (hemocultivo, PCR, bioquímica)', 'Punción lumbar si no está contraindicada', 'Antibioterapia empírica precoz: Ceftriaxona 100 mg/kg IV + Vancomicina 15 mg/kg', 'Dexametasona 0.15 mg/kg IV antes o con el primer antibiótico'], color: 'border-l-purple-500' },
];

export const VademecumView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'farmacos' | 'calculadoras' | 'protocolos'>('calculadoras');
  const [activeCalc, setActiveCalc] = useState<CalculatorTab | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

  const filteredDrugs = DRUGS.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.indications.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-16 space-y-6">
      {/* Cabecera */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 rounded-3xl p-6 text-white shadow-lg">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-70">Referencia rápida</p>
        <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3 mt-1">
          <span className="material-symbols-outlined text-3xl">prescriptions</span>
          Vademécum
        </h2>
        <p className="text-sm opacity-80 mt-1 font-medium">Fármacos, calculadoras y protocolos para atención primaria y pediatría</p>
      </div>

      {/* Navegación interna */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'calculadoras' as const, label: 'Calculadoras', icon: 'calculate' },
          { id: 'farmacos' as const, label: 'Vademécum', icon: 'prescriptions' },
          { id: 'protocolos' as const, label: 'Protocolos', icon: 'emergency' },
        ].map(s => (
          <button key={s.id} onClick={() => { setActiveSection(s.id); setSelectedDrug(null); setActiveCalc(null); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all whitespace-nowrap text-[10px] font-black uppercase tracking-widest ${
              activeSection === s.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Calculadoras */}
      {activeSection === 'calculadoras' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Seleccionar calculadora</p>
            {calculators.map(c => (
              <button key={c.id} onClick={() => setActiveCalc(c.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  activeCalc === c.id ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-emerald-600">{c.icon}</span>
                <div>
                  <p className="text-xs font-black text-gray-800">{c.title}</p>
                  <p className="text-[8px] font-bold text-gray-500">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-gray-200 p-6 shadow-sm">
              {activeCalc ? (
                <>
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">{calculators.find(c => c.id === activeCalc)?.icon}</span>
                    {calculators.find(c => c.id === activeCalc)?.title}
                  </h3>
                  <CalculatorForm calc={activeCalc} />
                  <p className="mt-4 text-[8px] font-bold text-gray-400 italic">* Dosis orientativas. Siempre comprobar con ficha técnica oficial y ajustar según criterio clínico.</p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-3">calculate</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">Selecciona una calculadora</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vademécum */}
      {activeSection === 'farmacos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] border border-gray-200 p-4 shadow-sm">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">search</span>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar fármaco..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="mt-3 space-y-1 max-h-[500px] overflow-y-auto no-scrollbar">
                {filteredDrugs.map(d => (
                  <button key={d.id} onClick={() => setSelectedDrug(d)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all text-xs ${
                      selectedDrug?.id === d.id ? 'bg-emerald-50 text-emerald-800 font-black' : 'text-gray-600 font-bold hover:bg-gray-50'
                    }`}
                  >
                    <span className="block leading-tight">{d.name}</span>
                    <span className="text-[8px] font-bold text-gray-400">{d.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            {selectedDrug ? (
              <div className="bg-white rounded-[2rem] border border-gray-200 p-6 shadow-sm space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8px] font-black uppercase tracking-widest">{selectedDrug.category}</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900">{selectedDrug.name}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[ 
                    { label: 'Indicaciones', value: selectedDrug.indications, icon: 'checklist' },
                    { label: 'Contraindicaciones', value: selectedDrug.contraindications, icon: 'block' },
                    { label: 'Dosificación adultos', value: selectedDrug.adultDosing, icon: 'pill' },
                    { label: 'Dosificación pediátrica', value: selectedDrug.pediatricDosing, icon: 'child_care' },
                    { label: 'Presentación', value: selectedDrug.presentation, icon: 'inventory_2' },
                    { label: 'Observaciones', value: selectedDrug.notes, icon: 'info' },
                  ].map(f => (
                    <div key={f.label} className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">{f.icon}</span>
                        {f.label}
                      </p>
                      <p className="text-xs font-bold text-gray-800 leading-relaxed">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-3">prescriptions</span>
                <p className="text-[10px] font-black uppercase tracking-widest">Selecciona un fármaco</p>
                <p className="text-[9px] font-bold text-gray-400 mt-1">Usa el buscador para encontrar información</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Protocolos */}
      {activeSection === 'protocolos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {protocols.map(p => (
            <div key={p.id} className={`bg-white rounded-[2rem] border border-gray-200 p-5 shadow-sm border-l-4 ${p.color}`}>
              <h3 className="text-xs font-black text-gray-800 flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-gray-600">{p.icon}</span>
                {p.title}
              </h3>
              <ol className="space-y-2">
                {p.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-[10px] font-bold text-gray-600 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-stone-100 text-[8px] flex items-center justify-center font-black text-stone-500 shrink-0 mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
        <p className="text-[8px] font-bold text-amber-700 leading-relaxed">
          Información orientativa para profesionales sanitarios. Siempre comprobar dosis y protocolos con las guías oficiales y fichas técnicas vigentes. Esta herramienta no sustituye el criterio clínico individual.
        </p>
      </div>
    </div>
  );
};

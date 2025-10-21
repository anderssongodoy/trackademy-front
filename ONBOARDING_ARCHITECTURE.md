# Arquitectura del Onboarding - Buenas Prácticas

## Estructura de Carpetas

```
src/
├── types/
│   └── onboarding.ts          # Tipos TypeScript centralizados
├── services/
│   └── onboardingService.ts   # Lógica de API centralizada
├── hooks/
│   └── useOnboarding.ts       # Custom hook para estado global
├── components/
│   └── onboarding/
│       ├── CampusStep.tsx     # Paso 1: Selección de Campus
│       ├── CycleStep.tsx      # Paso 2: Selección de Ciclo
│       ├── PreferencesStep.tsx # Paso 3: Preferencias
│       └── ProgressBar.tsx    # Barra de progreso reutilizable
└── app/
    └── onboarding/
        └── page.tsx           # Página principal del onboarding
```

## Principios Aplicados

### 1. **Separación de Responsabilidades**
- **`types/onboarding.ts`**: Define todas las interfaces TypeScript
- **`services/onboardingService.ts`**: Centraliza llamadas a API
- **`hooks/useOnboarding.ts`**: Gestiona lógica de estado y validación
- **`components/`**: Solo renderiza, no hace lógica de negocio
- **`page.tsx`**: Orquesta los componentes

### 2. **Tipado Fuerte con TypeScript**
```typescript
interface OnboardingFormData {
  campus: string;
  cycle: number;
  wantsAlerts: boolean;
  wantsIncentives: boolean;
  allowDataSharing: boolean;
}
```
- Todas las variables están tipadas
- Autocompletado y validación en tiempo de compilación
- Reduce bugs en producción

### 3. **Custom Hooks para Estado Compartido**
```typescript
const {
  currentStep,
  formData,
  campuses,
  cycles,
  loading,
  error,
  isSubmitting,
  nextStep,
  prevStep,
  updateFormData,
  submitOnboarding,
  clearError,
} = useOnboarding();
```
- Hook retorna estado y acciones de forma clara
- Lógica compleja encapsulada en el hook
- Componentes más simples y enfocados

### 4. **Servicio de API Centralizado**
```typescript
class OnboardingService {
  async submitOnboarding(data: OnboardingFormData): Promise<OnboardingResponse>
  async fetchCampuses(): Promise<Campus[]>
  async fetchCycles(): Promise<Cycle[]>
}
```
- Una única fuente de verdad para llamadas API
- Fácil de testear
- Fácil de cambiar endpoints
- Manejo centralizado de errores

### 5. **Componentes sin Lógica (Presentacionales)**
```typescript
export function CampusStep({ selected, campuses, onSelect }: CampusStepProps) {
  return (
    // Solo renderiza, sin useEffect ni estado
    // Toma props y llama callbacks
  );
}
```

### 6. **Validación y Manejo de Errores**
```typescript
const validateStep = useCallback((): boolean => {
  switch (currentStep) {
    case 1:
      if (!formData.campus) {
        setError("Por favor selecciona un campus");
        return false;
      }
      break;
    // ...
  }
  return true;
}, [currentStep, formData]);
```

### 7. **Estado de Carga y Envío**
- `loading`: Para cargar campuses/ciclos iniciales
- `isSubmitting`: Para deshabilitar botones durante envío
- `error`: Para mostrar mensajes de error

### 8. **Componentes Reutilizables**
```typescript
<ProgressBar current={currentStep} total={3} className="mb-8" />
```
- La barra de progreso es completamente reutilizable
- Acepta props para personalización
- Sin dependencias de estado

## Flujo de Datos

```
page.tsx (Orquestador)
    ↓
useOnboarding() (Estado + Lógica)
    ↓
onboardingService.ts (Llamadas API)
    ↓ (Usa TypeScript types para seguridad)
Backend API
    ↓ (Respuesta tipada)
Hook actualiza estado
    ↓
Componentes re-renderean
    ↓
Usuario ve cambios
```

## Características Implementadas

✅ **3-Step Wizard**: Campus → Ciclo → Preferencias
✅ **Validación por paso**: No permite avanzar sin completar
✅ **Manejo de errores**: Mensajes claros al usuario
✅ **Loading states**: UI clara durante operaciones async
✅ **Fallback values**: Si la API falla, usa valores por defecto
✅ **TypeScript completo**: Seguridad de tipos
✅ **Mobile-first**: Responsive en todos los tamaños
✅ **Accesible**: Checkboxes con labels claros
✅ **Código limpio**: Sin "spaghetti" code

## Próximos Pasos

1. **Backend**: Crear endpoints:
   - `POST /api/onboarding/submit` - Guardar datos de onboarding
   - `GET /api/campuses` - Listar campuses
   - `GET /api/cycles` - Listar ciclos académicos

2. **Integración BD**: Guardar preferencias del estudiante

3. **Dashboard**: Mostrar datos personalizados basado en onboarding

4. **Tests**: Añadir tests unitarios para:
   - Hook `useOnboarding`
   - Servicio `onboardingService`
   - Componentes presentacionales

## Ventajas de esta Arquitectura

- 🎯 **Claridad**: Fácil de entender qué hace cada archivo
- 🔧 **Mantenibilidad**: Cambios centralizados, bajo impacto
- 🧪 **Testeable**: Cada pieza se puede testear independientemente
- 📈 **Escalable**: Fácil de agregar más pasos o funcionalidades
- 🚀 **Performance**: No hay re-renders innecesarios
- 🛡️ **Seguro**: TypeScript previene muchos bugs

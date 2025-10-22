
"use client";


import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import { useSession } from "next-auth/react";
import { onboardingService } from "@/services/onboardingService";
import { OnboardingFormData } from "@/types/onboarding";
import { signOut } from "next-auth/react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import axios from "axios";
import Link from "next/link";

export default function DashboardPage() {
  const [openAlertModal, setOpenAlertModal] = useState(false);
  const [openCalendarModal, setOpenCalendarModal] = useState(false);
  const [openCourseModal, setOpenCourseModal] = useState(false);
  const [newAlertTitle, setNewAlertTitle] = useState("");
  const [newAlertMessage, setNewAlertMessage] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const handleAddAlert = async () => {
    if (!token || !newAlertTitle.trim() || !newAlertMessage.trim()) return;
    await axios.post("/api/student/alerts", { title: newAlertTitle, message: newAlertMessage }, { headers: { Authorization: `Bearer ${token}` } });
    setOpenAlertModal(false);
    setNewAlertTitle("");
    setNewAlertMessage("");
    setLoadingAlerts(true);
    axios.get("/api/student/alerts", { headers: { Authorization: `Bearer ${token}` } }).then(res => { setAlerts(res.data); }).finally(() => { setLoadingAlerts(false); });
  };
  const handleAddEvent = async () => {
    if (!token || !newEvent.trim()) return;
    await axios.post("/api/student/calendar", { title: newEvent }, { headers: { Authorization: `Bearer ${token}` } });
    setOpenCalendarModal(false);
    setNewEvent("");
    setLoadingCalendar(true);
    axios.get("/api/student/calendar", { headers: { Authorization: `Bearer ${token}` } }).then(res => { setCalendar(res.data); }).finally(() => { setLoadingCalendar(false); });
  };
  const handleAddCourse = async () => {
    if (!token || !newCourse.trim()) return;
    await axios.post("/api/onboarding/courses", { courses: [{ courseCode: newCourse }] }, { headers: { Authorization: `Bearer ${token}` } });
    setOpenCourseModal(false);
    setNewCourse("");
    setLoading(true);
    onboardingService.getOnboardingMe(token).then((res: Partial<OnboardingFormData> | null) => { setProfile(res); }).finally(() => { setLoading(false); });
  };
  const { data: session } = useSession();
  const token = typeof session === "object" && session !== null ? (session as { idToken?: string }).idToken : undefined;
  const [profile, setProfile] = useState<Partial<OnboardingFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Array<{ message?: string; title?: string }>>([]);
  const [calendar, setCalendar] = useState<Array<{ title?: string; name?: string }>>([]);
  const [recommendations, setRecommendations] = useState<Array<{ message?: string; title?: string }>>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!token) return;
    onboardingService.getOnboardingMe(token).then((res: Partial<OnboardingFormData> | null) => { if (mounted) setProfile(res); }).finally(() => { if (mounted) setLoading(false); });
    axios.get("/api/student/alerts", { headers: { Authorization: `Bearer ${token}` } }).then(res => { if (mounted) setAlerts(res.data); }).finally(() => { if (mounted) setLoadingAlerts(false); });
    axios.get("/api/student/calendar", { headers: { Authorization: `Bearer ${token}` } }).then(res => { if (mounted) setCalendar(res.data); }).finally(() => { if (mounted) setLoadingCalendar(false); });
    axios.get("/api/student/recommendations?limit=10", { headers: { Authorization: `Bearer ${token}` } }).then(res => { if (mounted) setRecommendations(res.data); }).finally(() => { if (mounted) setLoadingRecommendations(false); });
    return () => { mounted = false; };
  }, [token]);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #1e3a8a 0%, #0f172a 60%, #000 100%)', py: { xs: 3, sm: 6 }, px: { xs: 1, sm: 3 } }}>
      <Box maxWidth="lg" mx="auto">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h3" fontWeight={900} color="#fff" sx={{ textShadow: '0 2px 8px #0008' }}>
            Panel del Estudiante
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link href="/perfil" passHref legacyBehavior>
              <Button variant="outlined" color="primary" sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}>Perfil</Button>
            </Link>
            <Button variant="outlined" color="primary" onClick={() => signOut()} sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}>
              Cerrar sesión
            </Button>
          </Box>
        </Stack>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={6} lg={4}>
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.07)', boxShadow: 6, height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={700} color="#fff" gutterBottom>Alertas</Typography>
                  <Button variant="contained" size="small" onClick={() => setOpenAlertModal(true)} sx={{ bgcolor: '#2563eb', color: '#fff', fontWeight: 700 }}>Agregar</Button>
                </Stack>
                {loadingAlerts ? (
                  <Typography color="#fff8" align="center">Cargando...</Typography>
                ) : alerts.length ? (
                  <Stack spacing={1}>
                    {alerts.map((alert, i) => (
                      <Typography key={i} color="#fff" fontSize={15}>{alert.message || alert.title || JSON.stringify(alert)}</Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="#fff8" align="center">No tienes alertas. Conecta tus datos para recibir notificaciones.</Typography>
                )}
              </CardContent>
            </Card>
            <Dialog open={openAlertModal} onClose={() => setOpenAlertModal(false)}>
              <DialogTitle>Agregar alerta</DialogTitle>
              <DialogContent>
                <TextField autoFocus margin="dense" label="Título de la alerta" fullWidth value={newAlertTitle} onChange={e => setNewAlertTitle(e.target.value)} sx={{ mb: 2 }} />
                <TextField margin="dense" label="Mensaje" fullWidth multiline minRows={2} value={newAlertMessage} onChange={e => setNewAlertMessage(e.target.value)} />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenAlertModal(false)}>Cancelar</Button>
                <Button onClick={handleAddAlert} variant="contained">Agregar</Button>
              </DialogActions>
            </Dialog>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.07)', boxShadow: 6, height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={700} color="#fff" gutterBottom>Calendario</Typography>
                  <Button variant="contained" size="small" onClick={() => setOpenCalendarModal(true)} sx={{ bgcolor: '#2563eb', color: '#fff', fontWeight: 700 }}>Agregar</Button>
                </Stack>
                {loadingCalendar ? (
                  <Typography color="#fff8" align="center">Cargando...</Typography>
                ) : calendar.length ? (
                  <Stack spacing={1}>
                    {calendar.map((event, i) => (
                      <Typography key={i} color="#fff" fontSize={15}>{event.title || event.name || JSON.stringify(event)}</Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="#fff8" align="center">No tienes eventos en tu calendario. Agrega tus cursos para ver tu horario.</Typography>
                )}
              </CardContent>
            </Card>
            <Dialog open={openCalendarModal} onClose={() => setOpenCalendarModal(false)}>
              <DialogTitle>Agregar evento</DialogTitle>
              <DialogContent>
                <TextField autoFocus margin="dense" label="Título del evento" fullWidth value={newEvent} onChange={e => setNewEvent(e.target.value)} />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenCalendarModal(false)}>Cancelar</Button>
                <Button onClick={handleAddEvent} variant="contained">Agregar</Button>
              </DialogActions>
            </Dialog>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.07)', boxShadow: 6, height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={700} color="#fff" gutterBottom>Cursos actuales</Typography>
                  <Button variant="contained" size="small" onClick={() => setOpenCourseModal(true)} sx={{ bgcolor: '#2563eb', color: '#fff', fontWeight: 700 }}>Agregar</Button>
                </Stack>
                {loading ? (
                  <Typography color="#fff8" align="center">Cargando...</Typography>
                ) : profile && profile.courses?.length ? (
                  <Stack spacing={1}>
                    {profile.courses.map((c, i) => (
                      <Typography key={i} color="#fff" fontSize={15}>{c.courseCode ?? c.courseId}</Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="#fff8" align="center">No tienes cursos registrados. Agrega tus cursos actuales.</Typography>
                )}
              </CardContent>
            </Card>
            <Dialog open={openCourseModal} onClose={() => setOpenCourseModal(false)}>
              <DialogTitle>Agregar curso</DialogTitle>
              <DialogContent>
                <TextField autoFocus margin="dense" label="Código del curso" fullWidth value={newCourse} onChange={e => setNewCourse(e.target.value)} />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenCourseModal(false)}>Cancelar</Button>
                <Button onClick={handleAddCourse} variant="contained">Agregar</Button>
              </DialogActions>
            </Dialog>
          </Grid>
            <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.07)', boxShadow: 6, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#fff" gutterBottom>Intereses y estilo</Typography>
                {loading ? (
                  <Typography color="#fff8" align="center">Cargando...</Typography>
                ) : profile ? (
                  <Stack spacing={1}>
                    <Typography color="#fff" fontSize={15}>Intereses: {profile.careerInterests?.join(', ') ?? '-'}</Typography>
                    <Typography color="#fff" fontSize={15}>Estilo de aprendizaje: {profile.learningStyle ?? '-'}</Typography>
                    <Typography color="#fff" fontSize={15}>Motivación: {profile.motivationFactors?.join(', ') ?? '-'}</Typography>
                  </Stack>
                ) : (
                  <Typography color="#fff8" align="center">No hay datos.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.07)', boxShadow: 6, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#fff" gutterBottom>Tiempo y disponibilidad</Typography>
                {loading ? (
                  <Typography color="#fff8" align="center">Cargando...</Typography>
                ) : profile ? (
                  <Stack spacing={1}>
                    <Typography color="#fff" fontSize={15}>Horas de estudio/día: {profile.studyHoursPerDay ?? '-'}</Typography>
                    <Typography color="#fff" fontSize={15}>Preferencias de horario: {profile.preferredStudyTimes?.join(', ') ?? '-'}</Typography>
                    <Typography color="#fff" fontSize={15}>Horas de trabajo/semana: {profile.workHoursPerWeek ?? '-'}</Typography>
                    <Typography color="#fff" fontSize={15}>Horas extracurriculares/semana: {profile.extracurricularHoursPerWeek ?? '-'}</Typography>
                    <Typography color="#fff" fontSize={15}>Disponibilidad semanal:</Typography>
                    <Typography color="#fff8" fontSize={13}>{profile.weeklyAvailabilityJson ? JSON.stringify(profile.weeklyAvailabilityJson) : '-'}</Typography>
                  </Stack>
                ) : (
                  <Typography color="#fff8" align="center">No hay datos.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.07)', boxShadow: 6, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#fff" gutterBottom>Cursos actuales</Typography>
                {loading ? (
                  <Typography color="#fff8" align="center">Cargando...</Typography>
                ) : profile ? (
                  <Stack spacing={1}>
                    <Typography color="#fff" fontSize={15}>Término actual: {profile.termId ?? '-'}</Typography>
                    <Typography color="#fff" fontSize={15}>Cursos:</Typography>
                    <Box component="ul" sx={{ pl: 3, color: '#fff', fontSize: 14, mt: 1 }}>
                      {profile.courses?.length ? profile.courses.map((c: { courseCode?: string; courseId?: number }, i: number) => (
                        <li key={i}>{c.courseCode ?? c.courseId}</li>
                      )) : <li>-</li>}
                    </Box>
                  </Stack>
                ) : (
                  <Typography color="#fff8" align="center">No hay datos.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
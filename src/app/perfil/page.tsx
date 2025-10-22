"use client";
import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios from "axios";
import { useSession } from "next-auth/react";

type StudentMeDTO = {
  id: number;
  name: string;
  email: string;
  campusId?: number | string;
  programId?: number | string;
  currentTerm?: { code?: string };
};

export default function PerfilPage() {
  const { data: session } = useSession();
  const token = typeof session === "object" && session !== null ? (session as any).idToken ?? (session as any).id_token : undefined;
  const [student, setStudent] = useState<StudentMeDTO | null>(null);
  useEffect(() => {
    if (token) {
      axios.get("/api/student/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setStudent(res.data));
    }
  }, [token]);
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #1e3a8a 0%, #0f172a 60%, #000 100%)', py: { xs: 3, sm: 6 }, px: { xs: 1, sm: 3 } }}>
      <Box maxWidth="sm" mx="auto" pt={8}>
        <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.10)', boxShadow: 10, minWidth: 350 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={900} color="#fff" gutterBottom sx={{ textShadow: '0 2px 8px #0008' }}>Perfil del Estudiante</Typography>
            {student ? (
              <Box sx={{ color: '#fff', fontSize: 18, mt: 2, lineHeight: 2 }}>
                <div><b>Nombre:</b> {student.name}</div>
                <div><b>Email:</b> {student.email}</div>
                <div><b>Campus:</b> {student.campusId ?? '-'}</div>
                <div><b>Programa:</b> {student.programId ?? '-'}</div>
                <div><b>Término actual:</b> {student.currentTerm?.code ?? '-'}</div>
              </Box>
            ) : (
              <Typography color="#fff8">Cargando datos...</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

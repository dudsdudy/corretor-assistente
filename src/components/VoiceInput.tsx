import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  loading?: boolean;
}

const VoiceInput = ({ onTranscript, loading = false }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Here you would send the audio to your speech-to-text service
        // For now, we'll simulate with a placeholder
        const mockTranscript = `Cliente João Silva, 35 anos, masculino, engenheiro, 
        renda mensal de R$ 8.000, possui 2 dependentes, sem dívidas, 
        saúde excelente, não possui seguro de vida atualmente.`;
        
        setTranscript(mockTranscript);
        onTranscript(mockTranscript);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Gravação iniciada",
        description: "Fale sobre o perfil do seu cliente...",
      });
    } catch (error) {
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Gravação finalizada",
        description: "Processando seu áudio...",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-medium bg-gradient-card">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Volume2 className="h-6 w-6 text-primary" />
          Entrada por Voz
        </CardTitle>
        <CardDescription>
          Descreva o perfil do seu cliente falando naturalmente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className={`p-8 rounded-full ${isRecording ? 'bg-destructive/20 animate-pulse' : 'bg-primary/20'} transition-all duration-300`}>
            <Mic className={`h-16 w-16 ${isRecording ? 'text-destructive' : 'text-primary'}`} />
          </div>
          
          <div className="flex gap-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                variant="hero"
                size="xl"
                disabled={loading}
              >
                <Mic className="h-5 w-5 mr-2" />
                Iniciar Gravação
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="xl"
              >
                <Square className="h-5 w-5 mr-2" />
                Parar Gravação
              </Button>
            )}
          </div>

          {isRecording && (
            <p className="text-sm text-muted-foreground text-center animate-pulse">
              🎤 Gravando... Fale sobre idade, profissão, renda, dependentes e saúde do cliente
            </p>
          )}
        </div>

        {transcript && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
            <h4 className="font-semibold mb-2 text-primary">Transcrição:</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {transcript}
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>💡 <strong>Dica:</strong> Mencione idade, sexo, profissão, renda mensal, dependentes, dívidas e estado de saúde</p>
          <p>⚠️ <strong>Versão Demo:</strong> Usando transcrição simulada para demonstração</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceInput;
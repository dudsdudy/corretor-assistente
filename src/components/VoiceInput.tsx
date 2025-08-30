import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      console.log('Iniciando gravação de áudio...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,     // Reduzir para 16kHz (padrão Whisper)
          channelCount: 1,       // Mono
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Microfone acessado com sucesso');
      
      // Usar tipo de mídia mais compatível
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      let selectedMimeType = 'audio/webm';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      console.log(`Usando formato de áudio: ${selectedMimeType}`);
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000 // 128kbps para melhor qualidade
      });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log(`Chunk de áudio recebido: ${event.data.size} bytes`);
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        console.log('Gravação finalizada, processando áudio...');
        const audioBlob = new Blob(audioChunks, { type: selectedMimeType });
        console.log(`Tamanho total do áudio: ${audioBlob.size} bytes`);
        
        const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:audio/... prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        try {
          toast({ 
            title: 'Transcrevendo áudio...', 
            description: 'Aguarde alguns instantes enquanto processamos sua gravação.' 
          });
          
          const base64Audio = await toBase64(audioBlob);
          console.log(`Áudio convertido para base64: ${base64Audio.length} caracteres`);
          
          // Use Supabase client to call edge function
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          });

          if (error) {
            console.error('Erro na edge function:', error);
            throw new Error(error.message);
          }
          
          if (!data || !data.text) {
            console.error('Resposta inválida da edge function:', data);
            throw new Error('Falha na transcrição - resposta vazia');
          }

          console.log(`Transcrição recebida: "${data.text}"`);
          setTranscript(data.text);
          onTranscript(data.text);
          
          toast({
            title: "Transcrição concluída!",
            description: `Texto reconhecido: "${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}"`
          });
          
        } catch (err: any) {
          console.error('Erro na transcrição:', err);
          const fallback = 'Falha na transcrição. Tente falar mais próximo ao microfone e mais pausadamente.';
          setTranscript(fallback);
          toast({ 
            title: 'Falha na transcrição', 
            description: err.message || 'Erro desconhecido. Tente novamente.', 
            variant: 'destructive' 
          });
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Track de áudio liberado');
        });
      };

      // Gravar em chunks menores para melhor qualidade
      mediaRecorder.start(1000); // Chunk a cada 1 segundo
      setIsRecording(true);
      
      toast({
        title: "Gravação iniciada",
        description: "🎤 Fale claramente o nome e dados do cliente...",
      });
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
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
            <div className="text-sm text-muted-foreground text-center animate-pulse space-y-1">
              <p>🎤 Gravando... Fale pausadamente:</p>
              <p className="text-xs">Ex: "Cliente João Silva, 35 anos, trabalha como médico, ganha 15 mil reais, tem dois filhos, saúde excelente"</p>
            </div>
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
            <p>💡 <strong>Dica para melhor reconhecimento:</strong> Fale pausadamente e mencione:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>• <strong>Nome completo:</strong> "João da Silva"</li>
              <li>• <strong>Idade:</strong> "32 anos" ou "trinta e dois anos"</li>
              <li>• <strong>Profissão:</strong> "trabalha como engenheiro" ou "é médico"</li>
              <li>• <strong>Renda:</strong> "ganha 5 mil reais" ou "renda de R$ 5.000"</li>
              <li>• <strong>Dependentes:</strong> "tem 2 filhos" ou "possui dependentes"</li>
              <li>• <strong>Saúde:</strong> "saúde boa" ou "tem problemas de saúde"</li>
            </ul>
            <p className="mt-2">🎤 <strong>Transcrição Automática:</strong> Powered by OpenAI Whisper</p>
          </div>
      </CardContent>
    </Card>
  );
};

export default VoiceInput;
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TimeSavedCounterProps {
  userId?: string;
}

const TimeSavedCounter: React.FC<TimeSavedCounterProps> = ({ userId }) => {
  const [studiesCount, setStudiesCount] = useState(0);
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);
  const [animatedTime, setAnimatedTime] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cada estudo economiza aproximadamente 2-3 horas de trabalho manual
  const HOURS_PER_STUDY = 2.5;

  useEffect(() => {
    const fetchStudiesCount = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { count } = await supabase
          .from('client_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('broker_id', userId);

        const studies = count || 0;
        setStudiesCount(studies);
        
        const savedHours = studies * HOURS_PER_STUDY;
        setTotalTimeSaved(savedHours);
      } catch (error) {
        console.error('Erro ao buscar estudos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudiesCount();
  }, [userId]);

  // Animação do contador
  useEffect(() => {
    if (totalTimeSaved === 0) return;

    const duration = 2000; // 2 segundos
    const steps = 60;
    const increment = totalTimeSaved / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedTime(totalTimeSaved);
        return;
      }

      current += increment;
      setAnimatedTime(Math.floor(current));
      step++;
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalTimeSaved]);

  const formatTime = (hours: number) => {
    if (hours === 0) return "0h";
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes}min`;
    }
    
    if (minutes === 0) {
      return `${wholeHours}h`;
    }
    
    return `${wholeHours}h ${minutes}min`;
  };

  const getProductivityMessage = () => {
    if (totalTimeSaved === 0) return "Comece a gerar estudos para economizar tempo!";
    if (totalTimeSaved < 5) return "Ótimo início! Continue gerando estudos.";
    if (totalTimeSaved < 20) return "Excelente produtividade! Você está no caminho certo.";
    if (totalTimeSaved < 50) return "Impressionante! Você é um verdadeiro profissional.";
    return "Extraordinário! Você domina a eficiência em seguros.";
  };

  const getEquivalentWork = () => {
    if (totalTimeSaved < 8) return `${Math.round(totalTimeSaved * 60)} minutos de trabalho manual`;
    if (totalTimeSaved < 40) return `${Math.round(totalTimeSaved / 8)} dia${totalTimeSaved >= 16 ? 's' : ''} de trabalho`;
    return `${Math.round(totalTimeSaved / 40)} semana${totalTimeSaved >= 80 ? 's' : ''} de trabalho`;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-success text-success-foreground shadow-medium border-0">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-pulse w-8 h-8 bg-white/20 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="animate-pulse h-4 bg-white/20 rounded w-3/4"></div>
              <div className="animate-pulse h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-success text-success-foreground shadow-medium border-0 hover:shadow-glow transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-white/90" />
              <span className="text-sm font-medium text-white/90">Tempo Economizado</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-white">
                  {formatTime(animatedTime)}
                </span>
                {totalTimeSaved > 0 && (
                  <TrendingUp className="h-4 w-4 text-white/80" />
                )}
              </div>
              
              <p className="text-xs text-white/80">
                {studiesCount} estudo{studiesCount !== 1 ? 's' : ''} gerado{studiesCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <Zap className="h-8 w-8 text-white/60 mx-auto mb-2" />
            {totalTimeSaved > 0 && (
              <p className="text-xs text-white/70 max-w-[120px]">
                Equivale a {getEquivalentWork()}
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm text-white/90 font-medium text-center">
            {getProductivityMessage()}
          </p>
        </div>
        
        {totalTimeSaved > 10 && (
          <div className="mt-3 bg-white/10 rounded-lg p-3 text-center">
            <p className="text-xs text-white/80">
              💡 <strong>Dica:</strong> Compartilhe seus resultados com colegas e mostre como a tecnologia pode transformar o trabalho!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeSavedCounter;
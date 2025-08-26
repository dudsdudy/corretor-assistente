import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const commonProfessions = [
  "Administrador", "Advogado", "Arquiteto", "Assistente Social", "Bancário",
  "Biomédico", "Contador", "Corretor de Imóveis", "Corretor de Seguros", "Dentista",
  "Economista", "Educador Físico", "Enfermeiro", "Engenheiro Civil", "Engenheiro Elétrico",
  "Engenheiro Mecânico", "Empresário", "Farmacêutico", "Fisioterapeuta", "Funcionário Público",
  "Jornalista", "Médico", "Nutricionista", "Pedagogo", "Policial", "Professor",
  "Psicólogo", "Publicitário", "Vendedor", "Veterinário", "Aposentado", "Autônomo",
  "Do Lar", "Estudante"
];

interface ProfessionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const ProfessionAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Digite ou selecione uma profissão",
  required = false 
}: ProfessionAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const filteredProfessions = commonProfessions.filter((profession) =>
    profession.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (selectedValue: string) => {
    const profession = commonProfessions.find(p => p.toLowerCase() === selectedValue);
    if (profession) {
      setInputValue(profession);
      onChange(profession);
      setOpen(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="profession">
        Profissão {required && <span className="text-destructive">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 px-3 py-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              required={required}
              onClick={() => setOpen(true)}
            />
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar profissão..." />
            <CommandEmpty>Nenhuma profissão encontrada.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {filteredProfessions.map((profession) => (
                  <CommandItem
                    key={profession}
                    value={profession.toLowerCase()}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === profession ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {profession}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProfessionAutocomplete;
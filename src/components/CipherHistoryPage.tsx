import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ScrollText, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CipherHistoryPageProps {
  cipherName: string;
  onBack: () => void;
}

const CIPHER_HISTORIES: Record<string, string> = {
  "Caesar Cipher": "Julius Caesar himself invented and used this cipher around 58 BC to send secret military communications to his generals during the Gallic Wars. He typically shifted letters by three positions — so A became D, B became E, and so on. Caesar had such little faith in his enemies' ability to decode Latin that he considered even this simple shift sufficient protection. Roman historian Suetonius documented the cipher in his writings, making it one of the oldest encryption methods with a confirmed historical record. It was not just military either — Caesar used it for personal correspondence with friends and family, making it history's first documented personal privacy tool.",
  "Rail Fence Cipher": "The Rail Fence cipher gets its name from the way a split-rail wooden fence zigzags across a landscape and was widely used during the American Civil War by both Union and Confederate forces in the 1860s. Field officers needed a quick way to encode urgent battlefield messages without complex equipment — just paper and pencil. A soldier could memorize the method in minutes and encode a dispatch rider's message in seconds. Confederate spies carried messages encoded in Rail Fence through enemy lines hidden in coat linings and boot heels. Its simplicity was both its greatest strength in the field and its greatest weakness — Union cryptanalysts learned to crack it quickly, pushing both sides toward more complex methods as the war progressed.",
  "Vigenère Cipher": "For nearly three centuries the Vigenère Cipher was known throughout Europe as \"Le Chiffre Indéchiffrable\" — the unbreakable cipher. Developed by French diplomat Blaise de Vigenère in 1553 and published in his 1586 treatise, it was considered so secure that kings and ambassadors relied on it for their most sensitive diplomatic communications. Mary Queen of Scots famously used polyalphabetic substitution ciphers for her secret correspondence while imprisoned. It was not until 1863 that Prussian military officer Friedrich Kasiski published a method for breaking it by identifying the repeating keyword pattern — three hundred years after its invention. The cipher also appeared during the American Civil War when the Confederate army used a brass Vigenère cipher disk as their primary encryption device throughout the conflict.",
  "Transposition Cipher": "The Transposition Cipher has one of the oldest recorded uses in all of cryptographic history — the ancient Spartans used a physical version of it called the Scytale around 700 BC. A strip of leather or parchment was wound around a wooden staff of a specific diameter and the message written along its length. When unwound the letters appeared scrambled and meaningless — only a staff of the exact same diameter could reassemble the message. Spartan generals carried their scytale staffs into battle and Spartan ephors kept matching staffs at home for decoding dispatches. The columnar version used in Code Kracker XR became especially prominent during World War One when Germany, France and Britain all used variants of it — often layered with substitution ciphers — for field communications.",
  "Playfair Cipher": "The Playfair Cipher holds a unique distinction — it is named not after its inventor but after the man who promoted it. Scottish physicist Charles Wheatstone invented it in 1854 but his friend Lyon Playfair, Baron Playfair of St Andrews, championed it so enthusiastically to the British government that it took his name instead. The British Foreign Office adopted it and it became the official field cipher of the British Army during the Second Boer War in South Africa from 1899 to 1902. Its greatest moment came in World War One when it was the primary tactical cipher used by British and Australian forces. It was considered secure enough for battlefield use because even if an enemy captured the message they needed both the keyword and knowledge of the bigram rules to decode it — a significant barrier for the era.",
  "Nihilist Cipher": "The Nihilist Cipher takes its dramatic name from the Russian Nihilist movement — a radical 19th century revolutionary organization that sought to overthrow the Tsarist government through violence and terror. Russian anarchists and revolutionaries used this double-encryption method throughout the 1880s to communicate secretly under the surveillance of the Tsar's secret police, the Okhrana. The cipher was so associated with underground revolutionary activity that Russian authorities considered possessing a Polybius Square to be evidence of subversive intent. Perhaps most famously it was used to coordinate some of the communications surrounding the assassination of Tsar Alexander II in 1881 — one of the most consequential political assassinations of the 19th century. The cipher later found use among Soviet intelligence operatives in the early Cold War era.",
  "Enigma Cipher": "The Enigma machine is arguably the most famous encryption device in history and its story helped shape the modern world. Invented by German engineer Arthur Scherbius in 1818 and adopted by the German military in the late 1920s, the Enigma used a series of rotating mechanical rotors to create a cipher of almost unimaginable complexity — with over 150 quintillion possible settings. Nazi Germany used it to encrypt virtually all military communications during World War Two believing it to be completely unbreakable. The Allied effort to crack Enigma — led by Polish mathematicians and then British codebreakers at Bletchley Park including the legendary Alan Turing — is credited by historians with shortening the war by as much as two to four years and saving an estimated 14 million lives. Winston Churchill called the codebreakers at Bletchley Park \"the geese that laid the golden eggs and never cackled.\"",
  "Four-Square Cipher": "The Four-Square Cipher was invented by the prolific French cryptographer Félix Delastelle in 1902 and published just two years before his death in 1904. Delastelle was a passionate amateur cryptographer who spent much of his life developing new cipher systems and the Four-Square was considered his masterwork — a significant improvement over the Playfair Cipher that was already in wide military use. French intelligence operatives used variants of the Four-Square during World War One for communications that needed stronger protection than standard field ciphers could provide. The cipher gained renewed interest during World War Two when resistance fighters across occupied Europe used it for underground communications — its requirement for two separate keywords meant that even if an informant knew one key they could not decode the message without the second.",
  "Bifid Cipher": "The Bifid Cipher was also invented by the brilliant Félix Delastelle — published in 1895 making it his earlier masterwork before the Four-Square. Delastelle was fascinated by the concept of fractionation — breaking letters into their component parts before reassembling them in a new order — and the Bifid was his purest expression of that idea. Military cryptographers recognized that fractionation made frequency analysis — the primary codebreaking tool of the era — almost completely useless against it. The French Army used the Bifid extensively during World War One and it appeared in various modified forms in resistance communications during World War Two. Cryptographic historians consider Delastelle's invention of fractionation to be one of the most genuinely original ideas in the entire history of manual cryptography — a concept that would later influence the design of modern digital encryption algorithms.",
  "ADFGVX Cipher": "The ADFGVX Cipher was created by German Army Lieutenant Fritz Nebel in March 1918 during the final desperate offensive push of World War One and it became one of the most feared encryption systems of the entire war. The six letters A, D, F, G, V and X were deliberately chosen because their Morse code representations are very distinct from each other — minimizing transmission errors over noisy radio signals. The cipher was introduced just as Germany launched its massive Spring Offensive and Allied cryptanalysts initially considered it unbreakable. French Army Lieutenant Georges Painvin worked around the clock for weeks — reportedly losing 33 pounds from the physical and mental strain — before finally cracking it on June 2nd 1918. His breakthrough came just in time — the decoded messages revealed the location of Germany's critical supply lines and helped the Allies blunt the offensive. Many historians credit Painvin's cryptanalysis as one of the pivotal intelligence coups that turned the tide of World War One.",
};

export const CipherHistoryPage: React.FC<CipherHistoryPageProps> = ({ cipherName, onBack }) => {
  const history = CIPHER_HISTORIES[cipherName] || "No history available for this cipher.";

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 p-8 overflow-y-auto custom-scrollbar">
      {/* Back Button */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-zinc-400 hover:text-white flex items-center gap-2 group transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-[#D4AF37] transition-all">
            <ChevronLeft className="w-6 h-6 group-hover:text-[#D4AF37]" />
          </div>
          <span className="text-xl font-black uppercase tracking-widest italic">Back to Mission</span>
        </Button>
      </motion.div>

      {/* Header */}
      <div className="max-w-4xl mx-auto w-full mb-12 space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[24px] bg-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <HistoryIcon className="w-10 h-10 text-black" />
          </div>
          <div className="space-y-1">
            <h2 className="text-[#D4AF37] text-6xl font-black uppercase italic tracking-tighter drop-shadow-2xl">
              Cipher History
            </h2>
            <div className="flex items-center gap-3">
              <ScrollText className="w-5 h-5 text-zinc-500" />
              <span className="text-zinc-500 text-xl font-black uppercase tracking-[0.3em]">{cipherName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto w-full"
      >
        <div className="bg-zinc-900/50 p-12 rounded-[40px] border-4 border-zinc-800 shadow-2xl relative overflow-hidden group">
          {/* Background Highlight */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-[#D4AF37]/10 transition-colors" />
          
          <div className="relative z-10 space-y-8">
            <div className="w-16 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
            
            <p className="text-white text-3xl font-medium leading-[1.6] tracking-tight uppercase">
              {history}
            </p>

            <div className="pt-8 border-t border-white/5 flex justify-between items-center">
              <span className="text-zinc-600 font-mono text-sm tracking-widest uppercase">Historical Record</span>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]/30" />
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]/50" />
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-auto pt-16 text-center pb-8">
         <span className="text-zinc-700 font-black text-xs uppercase tracking-[0.5em] italic">
           CODE KRACKER XR SECURITY PROTOCOL • DATABASE: {cipherName.replace(' ', '_').toUpperCase()}
         </span>
      </div>
    </div>
  );
};

export const DIFFICULTIES = {
  debutant: { label: 'Débutant', points: 10, xp: 15, coins: 5, color: '#38bdf8' },
  facile: { label: 'Facile', points: 20, xp: 25, coins: 10, color: '#10b981' },
  intermediaire: { label: 'Intermédiaire', points: 35, xp: 45, coins: 20, color: '#f59e0b' },
  difficile: { label: 'Difficile', points: 50, xp: 70, coins: 35, color: '#ec4899' },
  expert: { label: 'Expert', points: 80, xp: 120, coins: 60, color: '#a855f7' },
};
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}
function lcm(a, b) {
  return Math.abs(a * b) / (gcd(a, b) || 1);
}
function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}
function getPrimeFactors(n) {
  const factors = [];
  let d = 2;
  while (n > 1) {
    while (n % d === 0) {
      factors.push(d);
      n /= d;
    }
    d++;
    if (d * d > n) {
      if (n > 1) factors.push(n);
      break;
    }
  }
  return factors;
}
function getDivisors(n) {
  const divs = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      divs.push(i);
      if (i !== n / i) divs.push(n / i);
    }
  }
  return divs.sort((a, b) => a - b);
}
const puzzleGenerators = {
  arithmetic_sequence(diff = 'facile') {
    const scale = diff === 'debutant' ? 5 : diff === 'facile' ? 10 : diff === 'intermediaire' ? 20 : 50;
    const a = randomInt(1, scale);
    const r = randomInt(2, diff === 'expert' ? 15 : 8);
    const len = 5;
    const terms = Array.from({ length: len }, (_, i) => a + i * r);
    const answer = a + len * r;
    return {
      type: 'arithmetic_sequence',
      categoryName: 'Suite Arithmétique',
      question: `Trouvez le terme suivant de la suite arithmétique :\n\`${terms.join(', ')}, ?\``,
      answer: String(answer),
      acceptableAnswers: [String(answer)],
      hints: [
        'Observez la différence entre deux nombres consécutifs.',
        `Chaque terme augmente d'une valeur constante : +${r}.`,
        `Le dernier nombre est ${terms[terms.length - 1]}, ajoutez ${r}.`,
      ],
      explanation: `Il s'agit d'une suite arithmétique de premier terme ${a} et de raison r = ${r}. Le terme suivant est ${terms[terms.length - 1]} + ${r} = **${answer}**.`,
    };
  },
  geometric_sequence(diff = 'facile') {
    const q = diff === 'debutant' || diff === 'facile' ? 2 : diff === 'intermediaire' ? 3 : randomInt(2, 4);
    const a = randomInt(1, diff === 'expert' ? 6 : 4);
    const len = 4;
    const terms = Array.from({ length: len }, (_, i) => a * Math.pow(q, i));
    const answer = a * Math.pow(q, len);
    return {
      type: 'geometric_sequence',
      categoryName: 'Suite Géométrique',
      question: `Quel est le nombre manquant dans cette progression géométrique ?\n\`${terms.join(', ')}, ?\``,
      answer: String(answer),
      acceptableAnswers: [String(answer)],
      hints: [
        'Divisez un terme par le précédent pour trouver le multiplicateur.',
        `Chaque terme est multiplié par ${q}.`,
        `Calculez ${terms[terms.length - 1]} × ${q}.`,
      ],
      explanation: `Chaque nombre est obtenu en multipliant le précédent par la raison q = ${q}. Donc ${terms[terms.length - 1]} × ${q} = **${answer}**.`,
    };
  },
  hidden_rule_sequence(diff = 'intermediaire') {
    const ruleTypes = ['fibonacci_like', 'squares', 'times2_plus_c'];
    const selected = ruleTypes[randomInt(0, ruleTypes.length - 1)];
    if (selected === 'fibonacci_like') {
      const x0 = randomInt(1, 4);
      const x1 = randomInt(2, 5);
      const seq = [x0, x1];
      for (let i = 2; i < 5; i++) seq.push(seq[i - 1] + seq[i - 2]);
      const answer = seq[3] + seq[4];
      return {
        type: 'hidden_rule_sequence',
        categoryName: 'Suite à Règle Cachée',
        question: `Déterminez la règle secrète et complétez la suite :\n\`${seq.join(', ')}, ?\``,
        answer: String(answer),
        acceptableAnswers: [String(answer)],
        hints: [
          'Chaque terme dépend des deux termes précédents.',
          `Vérifiez si ${seq[2]} = ${seq[0]} + ${seq[1]}.`,
          `Additionnez les deux derniers nombres : ${seq[3]} + ${seq[4]}.`,
        ],
        explanation: `Chaque nombre est la somme des deux précédents (style Fibonacci). Le terme suivant est ${seq[3]} + ${seq[4]} = **${answer}**.`,
      };
    }
    if (selected === 'squares') {
      const offset = randomInt(1, 5);
      const seq = [offset, offset + 1, offset + 2, offset + 3].map(n => n * n);
      const nextN = offset + 4;
      const answer = nextN * nextN;
      return {
        type: 'hidden_rule_sequence',
        categoryName: 'Suite de Carrés Parfaits',
        question: `Trouvez le nombre suivant de la suite :\n\`${seq.join(', ')}, ?\``,
        answer: String(answer),
        acceptableAnswers: [String(answer)],
        hints: [
          'Ces nombres sont tous des carrés parfaits (n²).',
          `Les racines carrées se suivent : ${offset}, ${offset + 1}, ${offset + 2}, ${offset + 3}...`,
          `Le prochain est (${nextN})² = ${nextN} × ${nextN}.`,
        ],
        explanation: `La suite correspond aux carrés des entiers successifs. Le terme cherché est ${nextN}² = **${answer}**.`,
      };
    }
    const c = randomInt(1, 3);
    let cur = randomInt(1, 3);
    const seq = [cur];
    for (let i = 1; i < 4; i++) {
      cur = cur * 2 + c;
      seq.push(cur);
    }
    const answer = cur * 2 + c;
    return {
      type: 'hidden_rule_sequence',
      categoryName: 'Suite Algébrique Cachée',
      question: `Découvrez la règle récurrente et donnez le terme suivant :\n\`${seq.join(', ')}, ?\``,
      answer: String(answer),
      acceptableAnswers: [String(answer)],
      hints: [
        'Chaque terme est multiplié par 2 auquel on ajoute une constante.',
        `La constante ajoutée est +${c}.`,
        `Faites ${cur} × 2 + ${c}.`,
      ],
      explanation: `La formule de récurrence est U(n+1) = 2 × U(n) + ${c}. Le prochain terme est 2 × ${cur} + ${c} = **${answer}**.`,
    };
  },
  missing_number(diff = 'facile') {
    const a = randomInt(2, 9);
    const b = randomInt(2, 9);
    const c = randomInt(2, 9);
    const product = a * b + c;
    return {
      type: 'missing_number',
      categoryName: 'Nombre Manquant',
      question: `Trouvez la valeur de **[ ? ]** qui vérifie la relation logique :\n\`( ${a} × ${b} ) + ${c} = [ ? ]\``,
      answer: String(product),
      acceptableAnswers: [String(product)],
      hints: [
        'Respectez la priorité de la multiplication sur l\'addition.',
        `Calculez d'abord ${a} × ${b} = ${a * b}.`,
        `Ajoutez ensuite ${c}.`,
      ],
      explanation: `Selon la priorité opératoire, ${a} × ${b} = ${a * b}, puis + ${c} donne **${product}**.`,
    };
  },
  multiples_divisors(diff = 'intermediaire') {
    const mode = randomInt(1, 2);
    if (mode === 1) {
      const g = randomInt(3, 9);
      const a = g * randomInt(2, 5);
      const b = g * randomInt(6, 9);
      const res = gcd(a, b);
      return {
        type: 'multiples_divisors',
        categoryName: 'PGCD (Plus Grand Commun Diviseur)',
        question: `Quel est le Plus Grand Commun Diviseur (PGCD) de **${a}** et **${b}** ?`,
        answer: String(res),
        acceptableAnswers: [String(res)],
        hints: [
          'Cherchez les diviseurs communs aux deux nombres.',
          `Les deux nombres sont divisibles par au moins ${g}.`,
          `La décomposition montre que le plus grand facteur commun est ${res}.`,
        ],
        explanation: `Les diviseurs de ${a} et ${b} ont pour plus grand diviseur commun **${res}**.`,
      };
    }
    const a = randomInt(4, 12);
    const b = randomInt(3, 8);
    const res = lcm(a, b);
    return {
      type: 'multiples_divisors',
      categoryName: 'PPCM (Plus Petit Commun Multiple)',
      question: `Quel est le Plus Petit Commun Multiple (PPCM) de **${a}** et **${b}** ?`,
      answer: String(res),
      acceptableAnswers: [String(res)],
      hints: [
        'C\'est le plus petit nombre non nul divisible à la fois par les deux.',
        `Le produit divisé par leur PGCD donne la réponse.`,
        `Vérifiez les multiples de ${Math.max(a, b)} : ${res}.`,
      ],
      explanation: `Le plus petit multiple commun non nul de ${a} et ${b} est **${res}**.`,
    };
  },
  parity_alternation(diff = 'debutant') {
    const count = randomInt(3, 7);
    const numbers = Array.from({ length: count }, () => randomInt(10, 99));
    const oddCount = numbers.filter(n => n % 2 !== 0).length;
    const isSumEven = oddCount % 2 === 0;
    const answer = isSumEven ? 'pair' : 'impair';
    return {
      type: 'parity_alternation',
      categoryName: 'Règle de Parité',
      question: `Sans calculer le total exact, déterminez si la somme suivante est **pair** ou **impair** :\n\`${numbers.join(' + ')}\``,
      answer: answer,
      acceptableAnswers: [answer, answer === 'pair' ? 'paire' : 'impaire'],
      hints: [
        'Comptez le nombre de termes impairs.',
        'La somme de deux nombres impairs est paire.',
        `Il y a exactement ${oddCount} nombre(s) impair(s).`,
      ],
      explanation: `Il y a ${oddCount} nombre(s) impair(s). Comme ce nombre est ${oddCount % 2 === 0 ? 'pair' : 'impair'}, la somme globale est **${answer}**.`,
    };
  },
  mental_math(diff = 'facile') {
    const a = randomInt(12, 35);
    const b = randomInt(3, 9);
    const c = randomInt(15, 60);
    const answer = a * b - c;
    return {
      type: 'mental_math',
      categoryName: 'Calcul Mental Rapide',
      question: `Calculez rapidement de tête le résultat de l'opération :\n\`${a} × ${b} - ${c} = ?\``,
      answer: String(answer),
      acceptableAnswers: [String(answer)],
      hints: [
        'Effectuez d\'abord la multiplication.',
        `${a} × ${b} = ${a * b}.`,
        `Soustrayez ${c} de ${a * b}.`,
      ],
      explanation: `${a} × ${b} = ${a * b}. En soustrayant ${c}, on obtient **${answer}**.`,
    };
  },
  simple_equations(diff = 'facile') {
    const x = randomInt(2, diff === 'expert' ? 25 : 12);
    const a = randomInt(2, diff === 'expert' ? 9 : 5);
    const b = randomInt(3, 20);
    const c = a * x + b;
    return {
      type: 'simple_equations',
      categoryName: 'Équation du Premier Degré',
      question: `Résolvez l'équation pour trouver la valeur de **x** :\n\`${a}x + ${b} = ${c}\``,
      answer: String(x),
      acceptableAnswers: [String(x)],
      hints: [
        `Isolez ${a}x en soustrayant ${b} des deux côtés.`,
        `${a}x = ${c - b}.`,
        `Divisez ${c - b} par ${a}.`,
      ],
      explanation: `${a}x = ${c} - ${b} = ${c - b}. En divisant par ${a}, x = ${c - b} / ${a} = **${x}**.`,
    };
  },
  number_comparison(diff = 'intermediaire') {
    const base = randomInt(2, 3);
    const exp = base === 2 ? 10 : 6;
    const valA = Math.pow(base, exp);
    const offset = randomInt(10, 50) * (Math.random() > 0.5 ? 1 : -1);
    const valB = valA + offset;
    const answer = offset < 0 ? '>' : '<';
    return {
      type: 'number_comparison',
      categoryName: 'Comparaison d\'Expressions',
      question: `Complétez par le symbole correct (**>** ou **<**) :\n\`${base}^${exp} [ ? ] ${valB}\``,
      answer: answer,
      acceptableAnswers: [answer],
      hints: [
        `Calculez la puissance de gauche : ${base}^${exp}.`,
        `${base}^${exp} vaut exactement ${valA}.`,
        `Comparez ${valA} avec ${valB}.`,
      ],
      explanation: `${base}^${exp} = ${valA}. Comme ${valA} est ${answer === '>' ? 'supérieur' : 'inférieur'} à ${valB}, le symbole est **${answer}**.`,
    };
  },
  number_ordering(diff = 'facile') {
    const nums = [randomInt(10, 99), randomInt(10, 99), randomInt(10, 99), randomInt(10, 99)];
    const unique = Array.from(new Set(nums));
    while (unique.length < 4) unique.push(randomInt(10, 99));
    const sorted = [...unique].sort((a, b) => a - b);
    const answer = sorted.join(' ');
    return {
      type: 'number_ordering',
      categoryName: 'Ordre Croissant',
      question: `Remettez ces 4 nombres dans l'ordre croissant (séparés par un espace) :\n\`${unique.join(', ')}\``,
      answer: answer,
      acceptableAnswers: [answer, sorted.join(', '), sorted.join(',')],
      hints: [
        'Repérez d\'abord le plus petit nombre.',
        `Le plus petit est ${sorted[0]}.`,
        `Le plus grand est ${sorted[3]}.`,
      ],
      explanation: `L'ordre croissant de ces nombres est : **${sorted.join(' < ')}**.`,
    };
  },
  complete_operation(diff = 'facile') {
    const a = randomInt(3, 12);
    const b = randomInt(4, 15);
    const prod = a * b;
    return {
      type: 'complete_operation',
      categoryName: 'Opération à Compléter',
      question: `Quel nombre remplace le point d'interrogation ?\n\`${a} × [ ? ] = ${prod}\``,
      answer: String(b),
      acceptableAnswers: [String(b)],
      hints: [
        'Divisez le résultat par le premier facteur.',
        `Faites ${prod} ÷ ${a}.`,
        `Le résultat est un entier compris entre 1 et 20.`,
      ],
      explanation: `Le nombre cherché est ${prod} ÷ ${a} = **${b}**.`,
    };
  },
  missing_symbols(diff = 'facile') {
    const a = randomInt(4, 12);
    const b = randomInt(2, 6);
    const ops = [
      { sym: '+', res: a + b, name: '+' },
      { sym: '-', res: a - b, name: '-' },
      { sym: '*', res: a * b, name: '*' },
    ];
    const chosen = ops[randomInt(0, ops.length - 1)];
    return {
      type: 'missing_symbols',
      categoryName: 'Symbole Opératoire Manquant',
      question: `Quel opérateur mathématique (+, -, * ou /) remplace [ ? ] ?\n\`${a} [ ? ] ${b} = ${chosen.res}\``,
      answer: chosen.sym,
      acceptableAnswers: [chosen.sym, chosen.sym === '*' ? 'x' : chosen.sym],
      hints: [
        'Testez successivement l\'addition, la soustraction et la multiplication.',
        `Vérifiez si le résultat est supérieur à la somme : ${a + b}.`,
        `La réponse est le symbole \`${chosen.sym}\`.`,
      ],
      explanation: `L'opération exacte est ${a} ${chosen.sym} ${b} = ${chosen.res}, l'opérateur est donc **${chosen.sym}**.`,
    };
  },
  digit_puzzles(diff = 'intermediaire') {
    const n = randomInt(100, 999);
    const digits = String(n).split('').map(Number);
    const sum = digits.reduce((acc, d) => acc + d, 0);
    return {
      type: 'digit_puzzles',
      categoryName: 'Somme des Chiffres',
      question: `Quelle est la somme de tous les chiffres composant le nombre **${n}** ?`,
      answer: String(sum),
      acceptableAnswers: [String(sum)],
      hints: [
        'Décomposez le nombre en chiffres individuels.',
        `Les chiffres sont ${digits.join(', ')}.`,
        `Additionnez ${digits.join(' + ')}.`,
      ],
      explanation: `La somme des chiffres de ${n} est ${digits.join(' + ')} = **${sum}**.`,
    };
  },
  constraint_logic(diff = 'difficile') {
    const candidates = [14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 91, 98];
    const filtered = candidates.filter(n => n % 2 === 0 && (n % 10 + Math.floor(n / 10)) === 10);
    const target = filtered[0] || 28;
    return {
      type: 'constraint_logic',
      categoryName: 'Déduction sous Contraintes',
      question: `Je suis un nombre à 2 chiffres.\n• Je suis un multiple de 7.\n• Je suis un nombre pair.\n• La somme de mes deux chiffres vaut 10.\nQui suis-je ?`,
      answer: String(target),
      acceptableAnswers: [String(target)],
      hints: [
        'Listez les multiples pairs de 7 à 2 chiffres : 14, 28, 42, 56, 70, 84, 98.',
        'Additionnez les dizaines et les unités de chacun.',
        `Pour 28 : 2 + 8 = 10 !`,
      ],
      explanation: `28 est un multiple de 7 (7 × 4), est pair, et 2 + 8 = 10. La réponse est **${target}**.`,
    };
  },
  odd_one_out(diff = 'intermediaire') {
    const primes = [11, 13, 17, 19];
    const nonPrime = 15;
    const all = [...primes, nonPrime].sort(() => Math.random() - 0.5);
    return {
      type: 'odd_one_out',
      categoryName: 'Détection de l\'Intrus',
      question: `Quel est l'intrus parmi cette liste de nombres ?\n\`${all.join(', ')}\``,
      answer: String(nonPrime),
      acceptableAnswers: [String(nonPrime)],
      hints: [
        'Vérifiez la primalité de chaque nombre.',
        'Quatre d\'entre eux sont des nombres premiers (divisibles uniquement par 1 et eux-mêmes).',
        `Un seul est divisible par 3 et 5 : ${nonPrime}.`,
      ],
      explanation: `Tous les nombres sont premiers sauf **${nonPrime}**, qui est divisible par 3 et 5 (3 × 5 = 15).`,
    };
  },
  magic_square(diff = 'intermediaire') {
    return {
      type: 'magic_square',
      categoryName: 'Carré Magique 3×3',
      question: `Dans ce carré magique 3×3, la somme de chaque ligne, colonne et diagonale vaut **15** :\n\`\`\`\n8 | 1 | 6\n3 | ? | 7\n4 | 9 | 2\n\`\`\`\nQuelle valeur remplace le **?** au centre ?`,
      answer: '5',
      acceptableAnswers: ['5'],
      hints: [
        'Regardez la ligne du milieu : 3 + ? + 7 = 15.',
        'Regardez la colonne du milieu : 1 + ? + 9 = 15.',
        '15 - 10 = 5.',
      ],
      explanation: `Sur la ligne centrale, 3 + 7 = 10, il manque donc 15 - 10 = **5** pour compléter la somme magique.`,
    };
  },
  math_balance(diff = 'facile') {
    const circleWeight = randomInt(2, 6);
    const triangleWeight = randomInt(3, 8);
    const leftCount = 2; // 2 triangles
    const rightWeight = leftCount * triangleWeight;
    return {
      type: 'math_balance',
      categoryName: 'Équilibre de Balance',
      question: `Une balance est parfaitement en équilibre :\n• Plateau gauche : **2 Triangles**\n• Plateau droit : **${rightWeight} kg**\nCombien pèse **1 Triangle** en kg ?`,
      answer: String(triangleWeight),
      acceptableAnswers: [String(triangleWeight), `${triangleWeight}kg`],
      hints: [
        'Divisez le poids total de droite par le nombre d\'objets à gauche.',
        `2 × Poids = ${rightWeight}.`,
        `Poids = ${rightWeight} ÷ 2.`,
      ],
      explanation: `Puisque 2 triangles pèsent ${rightWeight} kg, un seul triangle pèse ${rightWeight} ÷ 2 = **${triangleWeight} kg**.`,
    };
  },
  combinatorics(diff = 'intermediaire') {
    const digits = 3;
    const count = 3 * 2 * 1;
    return {
      type: 'combinatorics',
      categoryName: 'Dénombrement & Permutations',
      question: `Combien de nombres différents de 3 chiffres distincts peut-on former avec les chiffres **1, 2 et 3** sans répétition ?`,
      answer: '6',
      acceptableAnswers: ['6', 'six'],
      hints: [
        '3 choix pour le premier chiffre, 2 choix pour le second, 1 choix pour le troisième.',
        'Calculez 3 factorielle (3!).',
        '3 × 2 × 1 = 6.',
      ],
      explanation: `Il s'agit du nombre de permutations de 3 éléments : 3! = 3 × 2 × 1 = **6** possibilités (123, 132, 213, 231, 312, 321).`,
    };
  },
  elementary_probability(diff = 'facile') {
    return {
      type: 'elementary_probability',
      categoryName: 'Probabilité Élémentaire',
      question: `En lançant un dé classique à 6 faces équilibré, quelle est la probabilité en pourcentage d'obtenir un nombre pair (2, 4 ou 6) ?`,
      answer: '50',
      acceptableAnswers: ['50', '50%', '1/2'],
      hints: [
        'Il y a 3 faces paires sur un total de 6 faces.',
        'La fraction est 3/6.',
        '3/6 équivaut à 1/2 soit 50%.',
      ],
      explanation: `Il y a 3 résultats favorables (2, 4, 6) sur 6 issues possibles : 3/6 = 1/2 = **50%**.`,
    };
  },
  speed_challenge(diff = 'facile') {
    const a = randomInt(6, 12);
    const b = randomInt(6, 12);
    const answer = a * b;
    return {
      type: 'speed_challenge',
      categoryName: 'Défi Chrono Express',
      question: `⚡ Répondez au plus vite : combien vaut **${a} × ${b}** ?`,
      answer: String(answer),
      acceptableAnswers: [String(answer)],
      hints: [
        'Décomposez si besoin la multiplication.',
        `C'est le produit de ${a} par ${b}.`,
        `La réponse se termine par ${(a * b) % 10}.`,
      ],
      explanation: `${a} × ${b} = **${answer}**.`,
    };
  },
  numeric_mastermind(diff = 'intermediaire') {
    return {
      type: 'numeric_mastermind',
      categoryName: 'Mastermind Numérique',
      question: `Trouvez le code à 3 chiffres avec ces 2 indices :\n• \`6 8 2\` : Un chiffre est bien placé.\n• \`6 1 4\` : Un chiffre est correct mais mal placé.\n• \`2 0 6\` : Deux chiffres corrects mais mal placés.\n• \`7 3 8\` : Aucun chiffre n'est correct.\nQuel est ce code ?`,
      answer: '042',
      acceptableAnswers: ['042', '42'],
      hints: [
        'D\'après 7 3 8, éliminez 7, 3 et 8.',
        'Dans 6 8 2, le 8 est faux, donc 6 ou 2 est bien placé.',
        'Le code commence par 0, contient 4 et se termine par 2.',
      ],
      explanation: `8, 7, 3 sont exclus. 6 ne peut pas être correct d'après les déductions. Le dernier chiffre est 2, le premier est 0 et le chiffre central est 4. Le code est **042**.`,
    };
  },
  secret_number(diff = 'facile') {
    const target = randomInt(20, 80);
    const tens = Math.floor(target / 10);
    const units = target % 10;
    return {
      type: 'secret_number',
      categoryName: 'Nombre Secret Déductif',
      question: `Déduisez le nombre secret :\n• Il est compris entre ${tens * 10} et ${(tens + 1) * 10}.\n• Son chiffre des unités est ${units}.\nQui est-il ?`,
      answer: String(target),
      acceptableAnswers: [String(target)],
      hints: [
        `Le chiffre des dizaines est ${tens}.`,
        `Le chiffre des unités est ${units}.`,
        `Associez ${tens} et ${units}.`,
      ],
      explanation: `Le chiffre des dizaines étant ${tens} et celui des unités ${units}, le nombre est **${target}**.`,
    };
  },
  math_propositions(diff = 'debutant') {
    const isTrue = Math.random() > 0.5;
    const a = randomInt(2, 6);
    const b = a * 3;
    const statement = isTrue ? `${b} est un multiple de ${a}` : `${b + 1} est un multiple de ${a}`;
    const answer = isTrue ? 'vrai' : 'faux';
    return {
      type: 'math_propositions',
      categoryName: 'Vrai ou Faux Mathématique',
      question: `L'affirmation suivante est-elle **vrai** ou **faux** ?\n« **${statement}** »`,
      answer: answer,
      acceptableAnswers: [answer],
      hints: [
        `Vérifiez si le nombre de gauche est dans la table de ${a}.`,
        `Divisez le nombre par ${a} pour voir si le reste est nul.`,
        `La réponse est ${answer}.`,
      ],
      explanation: `L'affirmation « ${statement} » est **${answer.toUpperCase()}**.`,
    };
  },
  order_of_operations(diff = 'facile') {
    const a = randomInt(2, 8);
    const b = randomInt(2, 5);
    const c = randomInt(2, 6);
    const answer = a + b * c;
    return {
      type: 'order_of_operations',
      categoryName: 'Priorité des Opérations (PEMDAS)',
      question: `Calculez la valeur exacte selon les règles de priorité opératoire :\n\`${a} + ${b} × ${c} = ?\``,
      answer: String(answer),
      acceptableAnswers: [String(answer)],
      hints: [
        'La multiplication est prioritaire sur l\'addition.',
        `Calculez d'abord ${b} × ${c} = ${b * c}.`,
        `Ajoutez ensuite ${a}.`,
      ],
      explanation: `La multiplication est prioritaire : ${b} × ${c} = ${b * c}. Puis ${a} + ${b * c} = **${answer}**.`,
    };
  },
  multistep_logic(diff = 'intermediaire') {
    const sonAge = randomInt(8, 14);
    const fatherAge = sonAge * 3;
    const sum = sonAge + fatherAge;
    return {
      type: 'multistep_logic',
      categoryName: 'Problème de Logique à Étapes',
      question: `Un père a le triple de l'âge de son fils. La somme de leurs âges est de **${sum}** ans.\nQuel est l'âge du **fils** ?`,
      answer: String(sonAge),
      acceptableAnswers: [String(sonAge), `${sonAge} ans`],
      hints: [
        'Soit x l\'âge du fils. Le père a 3x.',
        `Leur somme est x + 3x = 4x = ${sum}.`,
        `Divisez ${sum} par 4.`,
      ],
      explanation: `Si x est l'âge du fils, le père a 3x. Ensemble : x + 3x = 4x = ${sum}. Donc x = ${sum} ÷ 4 = **${sonAge}** ans.`,
    };
  },
};
export function generatePuzzle(type = null, difficulty = 'facile') {
  const safeDiff = DIFFICULTIES[difficulty] ? difficulty : 'facile';
  const availableTypes = Object.keys(puzzleGenerators);
  const selectedType = type && puzzleGenerators[type] ? type : availableTypes[randomInt(0, availableTypes.length - 1)];
  const puzzleData = puzzleGenerators[selectedType](safeDiff);
  const diffMeta = DIFFICULTIES[safeDiff];
  return {
    id: `puzzle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...puzzleData,
    difficulty: safeDiff,
    difficultyLabel: diffMeta.label,
    points: diffMeta.points,
    xp: diffMeta.xp,
    coins: diffMeta.coins,
    color: diffMeta.color,
    createdAt: new Date(),
  };
}
export function normalizeAnswer(ans) {
  if (ans === undefined || ans === null) return '';
  return String(ans)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') 
    .replace(/\s+/g, ' ');
}
export function checkAnswer(puzzle, userAnswer) {
  if (!puzzle || !userAnswer) return false;
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedExpected = normalizeAnswer(puzzle.answer);
  if (normalizedUser === normalizedExpected) return true;
  if (Array.isArray(puzzle.acceptableAnswers)) {
    for (const alt of puzzle.acceptableAnswers) {
      if (normalizeAnswer(alt) === normalizedUser) return true;
    }
  }
  return false;
}
export function getDailyLogicPuzzle(dateStr = null) {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < targetDate.length; i++) {
    hash = (hash << 5) - hash + targetDate.charCodeAt(i);
    hash |= 0;
  }
  const typeKeys = Object.keys(puzzleGenerators);
  const typeIndex = Math.abs(hash) % typeKeys.length;
  const selectedType = typeKeys[typeIndex];
  const puzzle = generatePuzzle(selectedType, 'intermediaire');
  puzzle.isDaily = true;
  puzzle.date = targetDate;
  puzzle.title = `⭐ Défi Quotidien du ${targetDate}`;
  puzzle.points *= 2; 
  puzzle.xp *= 2;
  puzzle.coins *= 2;
  return puzzle;
}
export function getAvailablePuzzleTypes() {
  return Object.keys(puzzleGenerators).map(key => ({
    type: key,
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  }));
}

const CLASSES = [
  {
    id: 'cnt3004',
    code: 'CNT 3004',
    name: 'Computer Network Concepts',
    groups: [
      {
        label: 'ASSIGNMENTS',
        items: [
          {
            title: 'Assignment 1 – Networking Fundamentals and Tools',
            body: [
              `This assignment covered the basics of how networks work. I learned about the OSI and TCP/IP models, and the difference between MAC addresses, IP addresses, and port numbers. I also learned how data travels from a device, through the building's cabling, out to the ISP and onto the internet. For the hands-on part, I used tools like ping and traceroute, and my browser's developer tools to look at real web requests.`,
              `The hardest part was understanding how traceroute works and matching that idea to the output in the terminal. The commands also look a little different on each operating system, so I had to pay close attention. Overall, this assignment gave me a clear picture of how data moves across a network from start to finish.`,
            ],
          },
          {
            title: 'Assignment 2 – Ports, IP Addresses, and Wireshark',
            body: [
              `This assignment moved from the physical side of networks to how devices actually talk to each other. I learned about common port numbers, the difference between IPv4 and IPv6, and how subnet masks split an address into network and host parts. In Wireshark, I captured real traffic and looked at a web request, the TCP three-way handshake, and how DNS uses UDP.`,
              `One challenge was understanding how the TCP sequence and acknowledgment numbers change during the handshake. It was also tricky to filter Wireshark so I only saw one connection at a time. Seeing real packets made protocols I had only read about feel a lot more real.`,
            ],
          },
          {
            title: 'Assignment 3 – Physical Media and Wireless',
            body: [
              `This assignment looked at the bottom layers of networking: cables, signals, and Wi-Fi. I learned about coaxial, twisted pair, and fiber cables, and problems like signal loss, noise, and crosstalk. I also learned about duplex modes, multiplexing, and how wireless signals bounce and spread. In Wireshark, I compared real download speed to the speed of the connection, and looked at Wi-Fi frames in a capture file.`,
              `The hardest part was the math for network utilization and Wi-Fi overhead, because I had to keep megabytes, bits, and time units matching. This assignment showed me why real-world speeds are usually lower than the speeds advertised on paper.`,
            ],
          },
          {
            title: 'Assignment 4 – Virtualization, Cloud, Subnetting, and HTTP',
            body: [
              `This assignment covered virtual machines, cloud services, subnetting, and HTTP. I learned the difference between Type 1 and Type 2 hypervisors, and how IaaS, PaaS, and SaaS split up the work between the customer and the provider. I practiced subnetting by working out masks, address ranges, and gateways. In Wireshark, I studied how HTTP requests and responses work, including cached pages and a login that sends the password in an easily readable format.`,
              `Subnetting was the biggest challenge, especially working out the block sizes and address ranges. In Wireshark, it was also hard to find the right packets in all the background traffic. In the end, I understood much better how data is organized, sent, and why unencrypted logins are risky.`,
            ],
          },
          {
            title: 'Assignment 5-6 – Security, WANs, and TCP Recovery',
            body: [
              `These assignments covered network security and how networks handle problems. I looked at security certifications like Security+ and CISSP, and different types of WANs, from older ones like Frame Relay to newer ones like MPLS. I also worked with Windows management tools, security policies, firewalls, DMZs, and port security. In Wireshark, I compared a normal download with one that had packet loss to see how TCP recovers.`,
              `The main challenge was calculating the retransmission rate, and figuring out which warnings in Wireshark were real problems and which were just normal noise. This assignment showed me how security and reliability work together to keep a network running well.`,
            ],
          },
        ],
      },
      {
        label: 'DISCUSSIONS',
        items: [
          {
            title: 'Discussions Reflection',
            body: [
              `The course discussions showed me how fast technology is changing. Instead of relying only on big, faraway servers, things are moving closer to us with edge computing, faster fiber, and new Wi-Fi standards. With more remote work and more smart devices, security is harder than ever, so companies use tools like network segmentation and better monitoring. Networking today is less about plugging in cables and more about smart software, speed, and safety.`,
            ],
          },
        ],
      },
      {
        label: 'QUIZZES',
        items: [
          {
            title: 'Quizzes Reflection',
            body: [
              `The quizzes tested what I learned across the whole course, from OSI layers, IP addresses, and subnetting to Wireshark troubleshooting. They also covered cables, wireless, and security topics like firewalls, passwords, and port protection. They helped tie the textbook ideas to real troubleshooting and network safety.`,
            ],
          },
        ],
      },
    ],
  },
];

export function createClasses() {
  const page = document.querySelector('.os-page[data-panel="classes"]');
  const list = document.getElementById('osClassesList');
  const grid = document.getElementById('osClassGrid');
  const article = document.getElementById('osClassArticle');
  const back = document.getElementById('osClassBack');
  const content = document.getElementById('osContent');
  if (!page || !list || !grid || !article) return;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function closeClass() {
    article.classList.remove('active');
    list.classList.remove('hidden');
    if (content) content.scrollTop = 0;
  }

  function openClass(c) {
    document.getElementById('osClassCode').textContent = c.code;
    document.getElementById('osClassTitle').textContent = c.name;
    const body = document.getElementById('osClassBody');
    body.innerHTML = '';

    c.groups.forEach((g) => {
      body.appendChild(el('div', 'os-class-group-label', g.label));
      g.items.forEach((item) => {
        const row = el('div', 'os-reflection');
        const head = el('button', 'os-reflection-head');
        head.type = 'button';
        head.appendChild(el('span', 'os-reflection-title', item.title));
        head.appendChild(el('span', 'os-reflection-chev', '+'));
        const panel = el('div', 'os-reflection-body');
        item.body.forEach((p) => panel.appendChild(el('p', null, p)));
        head.addEventListener('click', () => {
          const open = row.classList.toggle('open');
          head.lastChild.textContent = open ? '–' : '+';
        });
        row.append(head, panel);
        body.appendChild(row);
      });
    });

    list.classList.add('hidden');
    article.classList.add('active');
    if (content) content.scrollTop = 0;
  }

  CLASSES.forEach((c) => {
    const card = el('button', 'os-project-card');
    card.type = 'button';
    card.innerHTML = `
      <span class="os-project-card-img"><span class="os-project-card-fallback">${c.code.split(' ')[0]}</span></span>
      <span class="os-project-card-body">
        <span class="os-project-card-top"><span class="os-project-card-status">${c.code}</span></span>
        <span class="os-project-card-title">${c.code} — ${c.name}</span>
        <span class="os-project-card-summary">${c.groups.reduce((n, g) => n + g.items.length, 0)} reflections</span>
      </span>`;
    card.addEventListener('click', () => openClass(c));
    grid.appendChild(card);
  });

  if (back) back.addEventListener('click', closeClass);

  // reset to the class grid whenever the Classes tab is left
  new MutationObserver(() => {
    if (!page.classList.contains('active')) closeClass();
  }).observe(page, { attributes: true, attributeFilter: ['class'] });
}
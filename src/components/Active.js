import { useState, useReducer, useCallback, useRef, useEffect } from "react";
import logo from "../logo/logo.png";
import { loadServers, saveServers } from "../serverData";

// ════════════════════════════════════════════════════════
// DOMAIN CONFIG
// ════════════════════════════════════════════════════════
const DOMAIN = "jeffery.local";
const DC_NAME = "DC01";

// ════════════════════════════════════════════════════════
// INITIAL STATE  — mirrors the real AD default containers
// (Builtin, Computers, Domain Controllers,
//  ForeignSecurityPrincipals, Managed Service Accounts,
//  plus custom OUs you'd create)
// ════════════════════════════════════════════════════════
const initialState = {
  domain: DOMAIN,
  domainControllers: [
    {
      name: "DC01",
      ip: "192.168.1.10",
      role: "PDC Emulator, RID Master, Infrastructure Master, Schema Master, Domain Naming Master",
      os: "Windows Server 2022",
      site: "Default-First-Site-Name",
      status: "Online",
      uptime: "47 days",
    },
    {
      name: "DC02",
      ip: "192.168.1.11",
      role: "Backup Domain Controller",
      os: "Windows Server 2019",
      site: "Default-First-Site-Name",
      status: "Online",
      uptime: "12 days",
    },
  ],
  // containers = real AD default containers (not OUs, but shown in tree)
  // parent: null means direct child of domain root
  ous: [
    // Default containers (built-in, cannot be deleted in real AD)
    {
      id: "cn-builtin",
      name: "Builtin",
      parent: null,
      type: "container",
      path: `CN=Builtin,DC=jeffery,DC=local`,
      protected: true,
    },
    {
      id: "cn-computers",
      name: "Computers",
      parent: null,
      type: "container",
      path: `CN=Computers,DC=jeffery,DC=local`,
      protected: true,
    },
    {
      id: "cn-dc",
      name: "Domain Controllers",
      parent: null,
      type: "ou",
      path: `OU=Domain Controllers,DC=jeffery,DC=local`,
      protected: true,
    },
    {
      id: "cn-fsp",
      name: "ForeignSecurityPrincipals",
      parent: null,
      type: "container",
      path: `CN=ForeignSecurityPrincipals,DC=jeffery,DC=local`,
      protected: true,
    },
    {
      id: "cn-msa",
      name: "Managed Service Accounts",
      parent: null,
      type: "container",
      path: `CN=Managed Service Accounts,DC=jeffery,DC=local`,
      protected: true,
    },
    {
      id: "cn-users",
      name: "Users",
      parent: null,
      type: "container",
      path: `CN=Users,DC=jeffery,DC=local`,
      protected: true,
    },
    // Custom OUs the admin created
    {
      id: "ou-it",
      name: "IT",
      parent: null,
      type: "ou",
      path: `OU=IT,DC=jeffery,DC=local`,
      protected: false,
    },
    {
      id: "ou-hr",
      name: "HR",
      parent: null,
      type: "ou",
      path: `OU=HR,DC=jeffery,DC=local`,
      protected: false,
    },
    {
      id: "ou-finance",
      name: "Finance",
      parent: null,
      type: "ou",
      path: `OU=Finance,DC=jeffery,DC=local`,
      protected: false,
    },
    {
      id: "ou-workst",
      name: "Workstations",
      parent: null,
      type: "ou",
      path: `OU=Workstations,DC=jeffery,DC=local`,
      protected: false,
    },
    {
      id: "ou-servers",
      name: "Servers",
      parent: null,
      type: "ou",
      path: `OU=Servers,DC=jeffery,DC=local`,
      protected: false,
    },
  ],
  users: [
    // Builtin users
    {
      id: "u-admin",
      firstName: "Administrator",
      lastName: "",
      username: "Administrator",
      email: `Administrator@${DOMAIN}`,
      ou: "cn-builtin",
      enabled: true,
      locked: false,
      pwdNeverExpires: true,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 06:00",
      groups: ["g-domadmins", "g-enterprise"],
      phone: "",
      title: "Built-in Admin",
      department: "",
      description: "Built-in account for administering the computer/domain",
      builtin: true,
    },
    {
      id: "u-guest",
      firstName: "Guest",
      lastName: "",
      username: "Guest",
      email: `Guest@${DOMAIN}`,
      ou: "cn-builtin",
      enabled: false,
      locked: false,
      pwdNeverExpires: true,
      mustChangePwd: false,
      cantChangePwd: true,
      pwdExpired: false,
      disabled: true,
      lastLogon: "Never",
      groups: [],
      phone: "",
      title: "",
      department: "",
      description: "Built-in account for guest access to the computer/domain",
      builtin: true,
    },
    // Regular users
    {
      id: "u-1",
      firstName: "John",
      lastName: "Addo",
      username: "j.addo",
      email: `j.addo@${DOMAIN}`,
      ou: "ou-it",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 08:42",
      groups: ["g-domadmins", "g-it"],
      phone: "+233 24 000 0001",
      title: "IT Manager",
      department: "IT",
      description: "Senior IT administrator",
    },
    {
      id: "u-2",
      firstName: "Ama",
      lastName: "Boateng",
      username: "a.boateng",
      email: `a.boateng@${DOMAIN}`,
      ou: "ou-hr",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 09:15",
      groups: ["g-hr"],
      phone: "+233 24 000 0002",
      title: "HR Director",
      department: "HR",
      description: "",
    },
    {
      id: "u-3",
      firstName: "Kwame",
      lastName: "Mensah",
      username: "k.mensah",
      email: `k.mensah@${DOMAIN}`,
      ou: "ou-finance",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: true,
      disabled: false,
      lastLogon: "2025-06-01 14:00",
      groups: ["g-finance"],
      phone: "+233 24 000 0003",
      title: "Finance Analyst",
      department: "Finance",
      description: "",
    },
    {
      id: "u-4",
      firstName: "Efua",
      lastName: "Asante",
      username: "e.asante",
      email: `e.asante@${DOMAIN}`,
      ou: "ou-it",
      enabled: false,
      locked: true,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: true,
      lastLogon: "2025-05-20 11:00",
      groups: ["g-it"],
      phone: "+233 24 000 0004",
      title: "Network Engineer",
      department: "IT",
      description: "Account suspended",
    },
    {
      id: "u-5",
      firstName: "Kofi",
      lastName: "Darko",
      username: "k.darko",
      email: `k.darko@${DOMAIN}`,
      ou: "ou-it",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: true,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 07:55",
      groups: ["g-it", "g-domadmins"],
      phone: "+233 24 000 0005",
      title: "Sys Administrator",
      department: "IT",
      description: "",
    },
    {
      id: "u-6",
      firstName: "Abena",
      lastName: "Osei",
      username: "a.osei",
      email: `a.osei@${DOMAIN}`,
      ou: "ou-hr",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: true,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-08 15:30",
      groups: ["g-hr"],
      phone: "+233 24 000 0006",
      title: "HR Officer",
      department: "HR",
      description: "",
    },
    {
      id: "u-7",
      firstName: "Yaw",
      lastName: "Owusu",
      username: "y.owusu",
      email: `y.owusu@${DOMAIN}`,
      ou: "ou-it",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 09:02",
      groups: ["g-it"],
      phone: "+233 24 000 0007",
      title: "Systems Engineer",
      department: "IT",
      description: "Windows and Linux systems engineer",
    },
    {
      id: "u-8",
      firstName: "Nana",
      lastName: "Adjei",
      username: "n.adjei",
      email: `n.adjei@${DOMAIN}`,
      ou: "ou-it",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 08:18",
      groups: ["g-it"],
      phone: "+233 24 000 0008",
      title: "Network Administrator",
      department: "IT",
      description: "Network operations administrator",
    },
    {
      id: "u-9",
      firstName: "Adwoa",
      lastName: "Frimpong",
      username: "a.frimpong",
      email: `a.frimpong@${DOMAIN}`,
      ou: "ou-hr",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 08:52",
      groups: ["g-hr"],
      phone: "+233 24 000 0009",
      title: "Recruitment Officer",
      department: "HR",
      description: "Recruitment and onboarding",
    },
    {
      id: "u-10",
      firstName: "Kojo",
      lastName: "Asare",
      username: "k.asare",
      email: `k.asare@${DOMAIN}`,
      ou: "ou-hr",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 07:45",
      groups: ["g-hr"],
      phone: "+233 24 000 0010",
      title: "People Operations Lead",
      department: "HR",
      description: "People operations and benefits",
    },
    {
      id: "u-11",
      firstName: "Akosua",
      lastName: "Badu",
      username: "a.badu",
      email: `a.badu@${DOMAIN}`,
      ou: "ou-finance",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 09:20",
      groups: ["g-finance"],
      phone: "+233 24 000 0011",
      title: "Senior Accountant",
      department: "Finance",
      description: "General ledger and reporting",
    },
    {
      id: "u-12",
      firstName: "Fiifi",
      lastName: "Quaye",
      username: "f.quaye",
      email: `f.quaye@${DOMAIN}`,
      ou: "ou-finance",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 08:05",
      groups: ["g-finance"],
      phone: "+233 24 000 0012",
      title: "Accounts Payable Analyst",
      department: "Finance",
      description: "Supplier payments and reconciliation",
    },
    {
      id: "u-13",
      firstName: "Mawuli",
      lastName: "Klu",
      username: "m.klu",
      email: `m.klu@${DOMAIN}`,
      ou: "ou-finance",
      enabled: false,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: true,
      pwdExpired: false,
      disabled: true,
      lastLogon: "2025-05-28 16:10",
      groups: ["g-finance"],
      phone: "+233 24 000 0013",
      title: "Finance Intern",
      department: "Finance",
      description: "Temporary account disabled pending review",
    },
    {
      id: "u-14",
      firstName: "Selina",
      lastName: "Amoah",
      username: "s.amoah",
      email: `s.amoah@${DOMAIN}`,
      ou: "cn-users",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 08:33",
      groups: ["g-domusers"],
      phone: "+233 24 000 0014",
      title: "Project Coordinator",
      department: "Operations",
      description: "Corporate project coordination",
    },
    {
      id: "u-15",
      firstName: "Richmond",
      lastName: "Tetteh",
      username: "r.tetteh",
      email: `r.tetteh@${DOMAIN}`,
      ou: "cn-users",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 08:49",
      groups: ["g-domusers"],
      phone: "+233 24 000 0015",
      title: "Operations Analyst",
      department: "Operations",
      description: "Business operations analyst",
    },
    {
      id: "u-16",
      firstName: "Esi",
      lastName: "Agyeman",
      username: "e.agyeman",
      email: `e.agyeman@${DOMAIN}`,
      ou: "cn-users",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 07:58",
      groups: ["g-domusers"],
      phone: "+233 24 000 0016",
      title: "Customer Support Lead",
      department: "Support",
      description: "Customer support team lead",
    },
    {
      id: "u-17",
      firstName: "Kweku",
      lastName: "Appiah",
      username: "k.appiah",
      email: `k.appiah@${DOMAIN}`,
      ou: "cn-users",
      enabled: true,
      locked: true,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-08 18:20",
      groups: ["g-domusers"],
      phone: "+233 24 000 0017",
      title: "Sales Executive",
      department: "Sales",
      description: "Account locked after repeated sign-in failures",
    },
    {
      id: "u-18",
      firstName: "Priscilla",
      lastName: "Nartey",
      username: "p.nartey",
      email: `p.nartey@${DOMAIN}`,
      ou: "cn-users",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: true,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 09:04",
      groups: ["g-domusers"],
      phone: "+233 24 000 0018",
      title: "Marketing Specialist",
      department: "Marketing",
      description: "Marketing and communications",
    },
    {
      id: "u-19",
      firstName: "Emmanuel",
      lastName: "Sarpong",
      username: "e.sarpong",
      email: `e.sarpong@${DOMAIN}`,
      ou: "cn-users",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: true,
      disabled: false,
      lastLogon: "2025-06-01 12:30",
      groups: ["g-domusers"],
      phone: "+233 24 000 0019",
      title: "Procurement Officer",
      department: "Procurement",
      description: "Password expired and requires reset",
    },
    {
      id: "u-20",
      firstName: "Linda",
      lastName: "Ofori",
      username: "l.ofori",
      email: `l.ofori@${DOMAIN}`,
      ou: "cn-users",
      enabled: true,
      locked: false,
      pwdNeverExpires: false,
      mustChangePwd: false,
      cantChangePwd: false,
      pwdExpired: false,
      disabled: false,
      lastLogon: "2025-06-09 08:12",
      groups: ["g-domusers"],
      phone: "+233 24 000 0020",
      title: "Legal Assistant",
      department: "Legal",
      description: "Legal department assistant",
    },
  ],
  computers: [
    {
      id: "c-dc1",
      name: "DC01",
      os: "Windows Server 2022",
      ip: "192.168.1.10",
      ou: "cn-dc",
      status: "Active",
      lastLogon: "2025-06-09 00:00",
      description: "Primary Domain Controller",
    },
    {
      id: "c-dc2",
      name: "DC02",
      os: "Windows Server 2019",
      ip: "192.168.1.11",
      ou: "cn-dc",
      status: "Active",
      lastLogon: "2025-06-09 00:00",
      description: "Backup Domain Controller",
    },
    {
      id: "c-1",
      name: "WS-ADDO-01",
      os: "Windows 11 Pro",
      ip: "192.168.1.101",
      ou: "ou-workst",
      status: "Active",
      lastLogon: "2025-06-09 08:40",
      description: "John Addo workstation",
    },
    {
      id: "c-2",
      name: "WS-BOATENG-01",
      os: "Windows 11 Pro",
      ip: "192.168.1.102",
      ou: "ou-workst",
      status: "Active",
      lastLogon: "2025-06-09 09:10",
      description: "Ama Boateng workstation",
    },
    {
      id: "c-3",
      name: "SRV-FILE-01",
      os: "Windows Server 2022",
      ip: "192.168.1.20",
      ou: "ou-servers",
      status: "Active",
      lastLogon: "2025-06-09 00:00",
      description: "File Server",
    },
    {
      id: "c-4",
      name: "SRV-PRINT-01",
      os: "Windows Server 2019",
      ip: "192.168.1.21",
      ou: "ou-servers",
      status: "Inactive",
      lastLogon: "2025-05-15 12:00",
      description: "Print Server",
    },
    {
      id: "c-5",
      name: "WS-IT-LAB-01",
      os: "Windows 11 Enterprise",
      ip: "192.168.1.110",
      ou: "cn-computers",
      status: "Active",
      lastLogon: "2025-06-09 09:12",
      description: "IT training lab workstation",
    },
    {
      id: "c-6",
      name: "WS-RECEPTION-01",
      os: "Windows 10 Enterprise",
      ip: "192.168.1.111",
      ou: "cn-computers",
      status: "Active",
      lastLogon: "2025-06-09 08:25",
      description: "Reception desk workstation",
    },
    {
      id: "c-7",
      name: "WS-TRAINING-02",
      os: "Windows 11 Pro",
      ip: "192.168.1.112",
      ou: "cn-computers",
      status: "Inactive",
      lastLogon: "2025-06-02 16:40",
      description: "Shared classroom workstation",
    },
  ],
  foreignSecurityPrincipals: [
    {
      id: "fsp-1",
      name: "S-1-5-21-428913502-118203948-902134775-1107",
      source: "PARTNER.LOCAL",
      type: "Foreign Security Principal",
      description: "External partner group referenced by a domain ACL",
    },
    {
      id: "fsp-2",
      name: "S-1-5-21-428913502-118203948-902134775-1134",
      source: "RESEARCH.LOCAL",
      type: "Foreign Security Principal",
      description: "Research forest user retained for shared project access",
    },
    {
      id: "fsp-3",
      name: "S-1-5-32-544",
      source: "BUILTIN",
      type: "Foreign Security Principal",
      description: "Well-known external administrator SID used by a trust",
    },
  ],
  groups: [
    // Builtin / default groups
    {
      id: "g-domadmins",
      name: "Domain Admins",
      type: "Security",
      scope: "Global",
      ou: "cn-users",
      description: "Designated administrators of the domain",
      members: ["u-admin", "u-1", "u-5"],
      builtin: true,
    },
    {
      id: "g-enterprise",
      name: "Enterprise Admins",
      type: "Security",
      scope: "Universal",
      ou: "cn-users",
      description: "Designated administrators of the enterprise",
      members: ["u-admin"],
      builtin: true,
    },
    {
      id: "g-domusers",
      name: "Domain Users",
      type: "Security",
      scope: "Global",
      ou: "cn-users",
      description: "All domain users",
      members: ["u-1", "u-2", "u-3", "u-4", "u-5", "u-6"],
      builtin: true,
    },
    {
      id: "g-domcomp",
      name: "Domain Computers",
      type: "Security",
      scope: "Global",
      ou: "cn-users",
      description: "All workstations and servers joined to the domain",
      members: [],
      builtin: true,
    },
    {
      id: "g-domctrl",
      name: "Domain Controllers",
      type: "Security",
      scope: "Global",
      ou: "cn-users",
      description: "All domain controllers in the domain",
      members: [],
      builtin: true,
    },
    {
      id: "g-gpco",
      name: "Group Policy Creator Owners",
      type: "Security",
      scope: "Global",
      ou: "cn-users",
      description:
        "Members in this group can modify group policy for the domain",
      members: ["u-admin"],
      builtin: true,
    },
    {
      id: "g-protusers",
      name: "Protected Users",
      type: "Security",
      scope: "Global",
      ou: "cn-users",
      description: "Members of this group are afforded additional protections",
      members: [],
      builtin: true,
    },
    {
      id: "g-keyadmins",
      name: "Key Admins",
      type: "Security",
      scope: "Global",
      ou: "cn-users",
      description:
        "Members of this group can perform administrative actions on key objects",
      members: [],
      builtin: true,
    },
    // Custom groups
    {
      id: "g-it",
      name: "IT-Staff",
      type: "Security",
      scope: "Global",
      ou: "ou-it",
      description: "IT department staff",
      members: ["u-1", "u-4", "u-5"],
      builtin: false,
    },
    {
      id: "g-hr",
      name: "HR-Team",
      type: "Security",
      scope: "Global",
      ou: "ou-hr",
      description: "Human Resources team",
      members: ["u-2", "u-6"],
      builtin: false,
    },
    {
      id: "g-finance",
      name: "Finance-Team",
      type: "Security",
      scope: "Global",
      ou: "ou-finance",
      description: "Finance department",
      members: ["u-3"],
      builtin: false,
    },
    {
      id: "g-alldl",
      name: "All-Staff-DL",
      type: "Distribution",
      scope: "Universal",
      ou: "cn-users",
      description: "All staff distribution list",
      members: ["u-1", "u-2", "u-3", "u-5", "u-6"],
      builtin: false,
    },
  ],
  gpos: [
    {
      id: "gpo-1",
      name: "Default Domain Policy",
      linkedTo: null,
      status: "Enabled",
      description: "Domain-wide password and account policies",
      settings: [
        "Minimum password length: 8 characters",
        "Password complexity: Enabled",
        "Account lockout threshold: 5 attempts",
        "Account lockout duration: 30 minutes",
        "Enforce password history: 24 passwords",
      ],
    },
    {
      id: "gpo-2",
      name: "Default Domain Controllers Policy",
      linkedTo: "cn-dc",
      status: "Enabled",
      description: "Security settings for Domain Controllers",
      settings: [
        "Audit logon events: Success, Failure",
        "Audit account management: Success",
        "Maximum log size: 16384 KB",
      ],
    },
    {
      id: "gpo-3",
      name: "IT Workstation Baseline",
      linkedTo: "ou-workst",
      status: "Enabled",
      description: "Baseline security for workstations",
      settings: [
        "Disable USB storage devices",
        "Screen lock after: 10 minutes",
        "Windows Firewall: Enabled (all profiles)",
        "Disable autorun",
      ],
    },
    {
      id: "gpo-4",
      name: "Server Hardening Policy",
      linkedTo: "ou-servers",
      status: "Enabled",
      description: "Security hardening for servers",
      settings: [
        "Audit logon events: Success, Failure",
        "Restrict RDP to IT-Staff group only",
        "NTP sync: DC01.jeffery.local",
        "Disable SMBv1",
      ],
    },
    {
      id: "gpo-5",
      name: "HR Desktop Restrictions",
      linkedTo: "ou-hr",
      status: "Disabled",
      description: "Desktop restrictions for HR OU",
      settings: [
        "Remove Control Panel from Start Menu",
        "Restrict access to cmd.exe",
        "Restrict access to registry tools",
      ],
    },
  ],
  dnsZones: [
    {
      id: "dns-1",
      name: `${DOMAIN}`,
      type: "Primary (AD-integrated)",
      records: [
        {
          name: "(same as parent folder)",
          type: "SOA",
          value: `DC01.${DOMAIN}. hostmaster.${DOMAIN}. [serial 100]`,
        },
        {
          name: "(same as parent folder)",
          type: "NS",
          value: `DC01.${DOMAIN}.`,
        },
        {
          name: "(same as parent folder)",
          type: "NS",
          value: `DC02.${DOMAIN}.`,
        },
        { name: "DC01", type: "A", value: "192.168.1.10" },
        { name: "DC02", type: "A", value: "192.168.1.11" },
        { name: "_ldap._tcp", type: "SRV", value: `0 100 389 DC01.${DOMAIN}` },
        {
          name: "_kerberos._tcp",
          type: "SRV",
          value: `0 100 88 DC01.${DOMAIN}`,
        },
        {
          name: "_kerberos._udp",
          type: "SRV",
          value: `0 100 88 DC01.${DOMAIN}`,
        },
        { name: "_gc._tcp", type: "SRV", value: `0 100 3268 DC01.${DOMAIN}` },
        { name: "DomainDnsZones", type: "A", value: "192.168.1.10" },
      ],
    },
    {
      id: "dns-2",
      name: "1.168.192.in-addr.arpa",
      type: "Primary (Reverse Lookup)",
      records: [
        { name: "10", type: "PTR", value: `DC01.${DOMAIN}.` },
        { name: "11", type: "PTR", value: `DC02.${DOMAIN}.` },
        { name: "101", type: "PTR", value: `WS-ADDO-01.${DOMAIN}.` },
        { name: "102", type: "PTR", value: `WS-BOATENG-01.${DOMAIN}.` },
      ],
    },
  ],
  events: [
    {
      id: "e-1",
      time: "2025-06-09 09:42:11",
      level: "Information",
      source: "Microsoft-Windows-Security-Auditing",
      eventId: 4624,
      category: "Logon",
      message:
        "An account was successfully logged on.\n\n\tSubject:\n\t\tSecurity ID: SYSTEM\n\t\tAccount Name: DC01$\n\n\tLogon Information:\n\t\tLogon Type: 3\n\t\tAccount: j.addo",
    },
    {
      id: "e-2",
      time: "2025-06-09 09:40:05",
      level: "Warning",
      source: "Microsoft-Windows-Security-Auditing",
      eventId: 4740,
      category: "Account Lockout",
      message:
        "A user account was locked out.\n\n\tSubject:\n\t\tSecurity ID: SYSTEM\n\n\tAccount That Was Locked Out:\n\t\tAccount Name: e.asante\n\n\tAdditional Info:\n\t\tCaller Computer Name: WS-ASANTE-01",
    },
    {
      id: "e-3",
      time: "2025-06-09 09:35:22",
      level: "Information",
      source: "GroupPolicy",
      eventId: 1500,
      category: "Group Policy",
      message:
        "The Group Policy settings for the computer were processed successfully. There were no changes detected since the last successful processing of Group Policy.",
    },
    {
      id: "e-4",
      time: "2025-06-09 08:00:01",
      level: "Information",
      source: "Microsoft-Windows-Security-Auditing",
      eventId: 4648,
      category: "Logon",
      message:
        "A logon was attempted using explicit credentials.\n\n\tSubject:\n\t\tAccount Name: k.darko\n\t\tTarget Server Name: DC01.jeffery.local",
    },
    {
      id: "e-5",
      time: "2025-06-08 23:55:00",
      level: "Error",
      source: "DNS Server",
      eventId: 4015,
      category: "DNS",
      message:
        "The DNS server has encountered a critical error from the Active Directory. Check that the Active Directory is functioning properly. The extended error debug information (which may be empty) is ''.",
    },
    {
      id: "e-6",
      time: "2025-06-08 22:10:45",
      level: "Information",
      source: "NTDS Replication",
      eventId: 1394,
      category: "Replication",
      message:
        "All problems impeding Active Directory Domain Services replication have been cleared on this domain controller.",
    },
    {
      id: "e-7",
      time: "2025-06-08 18:05:12",
      level: "Information",
      source: "Microsoft-Windows-Security-Auditing",
      eventId: 4720,
      category: "Account Management",
      message:
        "A user account was created.\n\n\tSubject:\n\t\tAccount Name: j.addo\n\n\tNew Account:\n\t\tAccount Name: a.osei\n\t\tAccount Domain: JEFFERY",
    },
    {
      id: "e-8",
      time: "2025-06-08 14:22:05",
      level: "Warning",
      source: "Microsoft-Windows-Security-Auditing",
      eventId: 4625,
      category: "Account Lockout",
      message:
        "An account failed to log on.\n\n\tAccount: k.mensah\n\tFailure Reason: Unknown user name or bad password.\n\tLogon Type: 3",
    },
  ],
};

// ════════════════════════════════════════════════════════
// REDUCER
// ════════════════════════════════════════════════════════
function adReducer(state, action) {
  switch (action.type) {
    case "ADD_USER":
      return { ...state, users: [...state.users, action.payload] };
    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.id ? { ...u, ...action.payload } : u,
        ),
      };
    case "DELETE_USER":
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload),
      };
    case "ADD_GROUP":
      return { ...state, groups: [...state.groups, action.payload] };
    case "UPDATE_GROUP":
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.id ? { ...g, ...action.payload } : g,
        ),
      };
    case "DELETE_GROUP":
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.payload),
      };
    case "ADD_COMPUTER":
      return { ...state, computers: [...state.computers, action.payload] };
    case "UPDATE_COMPUTER":
      return {
        ...state,
        computers: state.computers.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c,
        ),
      };
    case "DELETE_COMPUTER":
      return {
        ...state,
        computers: state.computers.filter((c) => c.id !== action.payload),
      };
    case "ADD_OU":
      return { ...state, ous: [...state.ous, action.payload] };
    case "DELETE_OU":
      return {
        ...state,
        ous: state.ous.filter((o) => o.id !== action.payload),
      };
    case "ADD_GPO":
      return { ...state, gpos: [...state.gpos, action.payload] };
    case "TOGGLE_GPO":
      return {
        ...state,
        gpos: state.gpos.map((g) =>
          g.id === action.payload
            ? { ...g, status: g.status === "Enabled" ? "Disabled" : "Enabled" }
            : g,
        ),
      };
    case "DELETE_GPO":
      return {
        ...state,
        gpos: state.gpos.filter((g) => g.id !== action.payload),
      };
    case "ADD_EVENT":
      return { ...state, events: [action.payload, ...state.events] };
    default:
      return state;
  }
}

let _id = 2000;
const newId = (prefix) => `${prefix}-${++_id}`;
const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

// ════════════════════════════════════════════════════════
// DESIGN TOKENS
// ════════════════════════════════════════════════════════
const T = {
  navy: "#003a6b",
  blue: "#0055a4",
  blue2: "#0078d4",
  sidebar: "#1b2a3a",
  sideHL: "rgba(0,120,212,0.30)",
  sideTxt: "#b8c8d8",
  sideAct: "#5bb8ff",
  bg: "#e9ecef",
  surface: "#ffffff",
  border: "#d0d5db",
  borderL: "#e8eaed",
  text: "#1a1a1a",
  textSub: "#555f6d",
  textMut: "#8b95a1",
  green: "#107c10",
  greenBg: "#dff0df",
  red: "#c42b1c",
  redBg: "#fde7e9",
  amber: "#9a5300",
  amberBg: "#fff4ce",
  purple: "#5c2d91",
  purpleBg: "#ede7f6",
};
const shadow = "0 1px 4px rgba(0,0,0,0.12)";

// ════════════════════════════════════════════════════════
// SMALL SHARED COMPONENTS
// ════════════════════════════════════════════════════════
const S = {
  // styles
  input: {
    width: "100%",
    padding: "5px 8px",
    fontSize: 13,
    border: `1px solid ${T.border}`,
    borderRadius: 2,
    background: T.surface,
    boxSizing: "border-box",
    outline: "none",
  },
  btnPrimary: {
    padding: "5px 18px",
    background: T.blue2,
    color: "#fff",
    border: "none",
    borderRadius: 2,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  btnSecondary: {
    padding: "5px 12px",
    background: "#f0f0f0",
    color: T.text,
    border: `1px solid ${T.border}`,
    borderRadius: 2,
    cursor: "pointer",
    fontSize: 13,
  },
  btnDanger: {
    padding: "5px 12px",
    background: T.redBg,
    color: T.red,
    border: `1px solid #f0b8bb`,
    borderRadius: 2,
    cursor: "pointer",
    fontSize: 13,
  },
  th: {
    padding: "7px 10px",
    textAlign: "left",
    fontWeight: 700,
    color: "#444",
    fontSize: 12,
    borderBottom: `2px solid ${T.border}`,
    background: "#f3f5f7",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "6px 10px",
    fontSize: 13,
    borderBottom: `1px solid ${T.borderL}`,
    verticalAlign: "middle",
  },
};

function Badge({ label, color = T.green, bg = T.greenBg }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 700,
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}
// eslint-disable-next-line no-unused-vars
function ADStatusBadge({ enabled, locked, pwdExpired, mustChangePwd }) {
  if (locked) return <Badge label="Locked" bg={T.redBg} color={T.red} />;
  if (!enabled) return <Badge label="Disabled" bg="#ececec" color="#666" />;
  if (pwdExpired)
    return <Badge label="Pwd Expired" bg={T.amberBg} color={T.amber} />;
  if (mustChangePwd)
    return <Badge label="Must Change Pwd" bg={T.amberBg} color={T.amber} />;
  return <Badge label="Active" bg={T.greenBg} color={T.green} />;
}

function Field({ label, children, half }) {
  return (
    <div style={{ marginBottom: 10, ...(half ? {} : {}) }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "#333",
          marginBottom: 3,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ViewHint({ children }) {
  return (
    <div
      style={{
        background: "#e8f0fe",
        border: `1px solid #c5dbf4`,
        borderLeft: `3px solid ${T.blue2}`,
        color: "#24415f",
        padding: "8px 10px",
        marginBottom: 12,
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      <strong style={{ color: T.navy }}>Learning note:</strong> {children}
    </div>
  );
}

// Right-click context menu
function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: x,
        top: y,
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "2px 4px 12px rgba(0,0,0,0.22)",
        borderRadius: 2,
        zIndex: 9999,
        minWidth: 180,
        paddingTop: 2,
        paddingBottom: 2,
      }}
    >
      {items.map((item, i) =>
        item === "---" ? (
          <div
            key={i}
            style={{ height: 1, background: T.borderL, margin: "3px 0" }}
          />
        ) : item.sub ? (
          <SubMenuItem
            key={i}
            label={item.label}
            icon={item.icon}
            sub={item.sub}
            onClose={onClose}
          />
        ) : (
          <div
            key={i}
            onClick={() => {
              item.action?.();
              onClose();
            }}
            style={{
              padding: "6px 18px",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: item.danger ? T.red : T.text,
              fontWeight: item.bold ? 700 : 400,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f0fe")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {item.icon && <span style={{ color: T.blue2 }}>{item.icon}</span>}
            {item.label}
          </div>
        ),
      )}
    </div>
  );
}

function SubMenuItem({ label, icon, sub, onClose }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  return (
    <div
      ref={ref}
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        style={{
          padding: "6px 18px",
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: open ? "#e8f0fe" : "transparent",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && <span style={{ color: T.blue2 }}>{icon}</span>}
          {label}
        </span>
        <span style={{ fontSize: 9 }}>▶</span>
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            left: "100%",
            top: 0,
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "2px 4px 12px rgba(0,0,0,0.2)",
            borderRadius: 2,
            minWidth: 180,
            zIndex: 10000,
            paddingTop: 2,
            paddingBottom: 2,
          }}
        >
          {sub.map((item, i) =>
            item === "---" ? (
              <div
                key={i}
                style={{ height: 1, background: T.borderL, margin: "3px 0" }}
              />
            ) : (
              <div
                key={i}
                onClick={() => {
                  item.action?.();
                  onClose();
                }}
                style={{
                  padding: "6px 18px",
                  fontSize: 13,
                  cursor: "pointer",
                  background: "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#e8f0fe")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {item.label}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// Toolbar button
function ToolbarBtn({ title, children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? "#cce4ff" : "transparent",
        border: `1px solid ${active ? "#90c4f0" : "transparent"}`,
        borderRadius: 2,
        padding: "3px 5px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#333",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "#e8f0fe";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════════════════
function Modal({ title, onClose, children, width = 520, titleIcon }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#f0f0f0",
          border: "1px solid #888",
          borderRadius: 2,
          width,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "6px 6px 18px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.blue} 100%)`,
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {titleIcon && <span style={{ opacity: 0.9 }}>{titleIcon}</span>}
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 16,
              opacity: 0.8,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Tab component used inside modals (like real AD Properties tabs)
function Tabs({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: `2px solid ${T.border}`,
        marginBottom: 14,
        gap: 1,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: "5px 14px",
            fontSize: 13,
            border: `1px solid ${active === t ? T.border : "transparent"}`,
            borderBottom:
              active === t ? "2px solid #f0f0f0" : `1px solid ${T.border}`,
            marginBottom: active === t ? -2 : 0,
            background: active === t ? "#f0f0f0" : "#e0e0e0",
            cursor: "pointer",
            borderRadius: "2px 2px 0 0",
            fontWeight: active === t ? 600 : 400,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// NEW USER WIZARD  (3-step like real ADUC)
// ════════════════════════════════════════════════════════
function NewUserWizard({ state, onSave, onClose, defaultOU }) {
  const [step, setStep] = useState(1); // 1=Name/logon, 2=Password, 3=Summary
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    initials: "",
    displayName: "",
    username: "",
    upnSuffix: DOMAIN,
    ou: defaultOU || "cn-users",
    password: "",
    confirmPwd: "",
    mustChangePwd: true,
    cantChangePwd: false,
    pwdNeverExpires: false,
    disabled: false,
    enabled: true,
    locked: false,
    pwdExpired: false,
    phone: "",
    title: "",
    department: "",
    description: "",
    email: "",
    groups: [],
  });
  const [pwdErr, setPwdErr] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const autoDisplayName = () => {
    if (
      !form.displayName ||
      form.displayName === `${form.firstName} ${form.lastName}`.trim()
    ) {
      set("displayName", `${form.firstName} ${form.lastName}`.trim());
    }
  };

  const goNext = () => {
    if (step === 2) {
      if (form.password !== form.confirmPwd) {
        setPwdErr("Passwords do not match.");
        return;
      }
      if (form.password.length < 7) {
        setPwdErr("Password must be at least 7 characters.");
        return;
      }
      setPwdErr("");
    }
    setStep((s) => s + 1);
  };

  const finish = () => {
    onSave({
      ...form,
      id: newId("u"),
      lastLogon: "Never",
      enabled: !form.disabled,
      locked: false,
    });
  };

  const ouName = state.ous.find((o) => o.id === form.ou)?.name || form.ou;
  const createIn = `${DOMAIN}/${ouName}`;

  return (
    <Modal
      title="New Object - User"
      onClose={onClose}
      width={500}
      titleIcon={<span>👤</span>}
    >
      {/* Step indicator */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          fontSize: 12,
          color: T.textSub,
        }}
      >
        {["Account Info", "Password", "Summary"].map((s, i) => (
          <div
            key={s}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 11,
                background:
                  step === i + 1 ? T.blue2 : step > i + 1 ? T.green : "#ccc",
                color: "#fff",
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontWeight: step === i + 1 ? 700 : 400,
                color: step === i + 1 ? T.navy : T.textSub,
              }}
            >
              {s}
            </span>
            {i < 2 && <span style={{ color: "#ccc" }}>›</span>}
          </div>
        ))}
      </div>

      {/* Create in indicator */}
      <div
        style={{
          fontSize: 12,
          color: T.textSub,
          background: "#f5f7fa",
          border: `1px solid ${T.borderL}`,
          borderRadius: 2,
          padding: "5px 10px",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>👤</span>
        <span>
          Create in: <strong>{createIn}</strong>
        </span>
      </div>

      {/* ── STEP 1: Name & Logon ── */}
      {step === 1 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 60px 1fr",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <Field label="First name">
              <input
                style={S.input}
                value={form.firstName}
                onChange={(e) => {
                  set("firstName", e.target.value);
                }}
                onBlur={autoDisplayName}
              />
            </Field>
            <Field label="Initials">
              <input
                style={S.input}
                value={form.initials}
                onChange={(e) => set("initials", e.target.value)}
                maxLength={3}
              />
            </Field>
            <Field label="Last name">
              <input
                style={S.input}
                value={form.lastName}
                onChange={(e) => {
                  set("lastName", e.target.value);
                }}
                onBlur={autoDisplayName}
              />
            </Field>
          </div>
          <Field label="Full name">
            <input
              style={S.input}
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
            />
          </Field>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "end",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <Field label="User logon name (UPN)">
              <input
                style={S.input}
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
              />
            </Field>
            <span style={{ paddingBottom: 10, fontSize: 13, color: T.textSub }}>
              @
            </span>
            <Field label=" ">
              <select
                style={S.input}
                value={form.upnSuffix}
                onChange={(e) => set("upnSuffix", e.target.value)}
              >
                <option>{DOMAIN}</option>
              </select>
            </Field>
          </div>
          <Field label="Organizational Unit">
            <select
              style={S.input}
              value={form.ou}
              onChange={(e) => set("ou", e.target.value)}
            >
              {state.ous.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      {/* ── STEP 2: Password (matches screenshot exactly) ── */}
      {step === 2 && (
        <>
          <Field label="Password:">
            <input
              style={S.input}
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </Field>
          <Field label="Confirm:">
            <input
              style={S.input}
              type="password"
              value={form.confirmPwd}
              onChange={(e) => set("confirmPwd", e.target.value)}
            />
          </Field>
          {pwdErr && (
            <div
              style={{
                color: T.red,
                fontSize: 12,
                margin: "-6px 0 10px",
                padding: "4px 8px",
                background: T.redBg,
                borderRadius: 2,
              }}
            >
              {pwdErr}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              margin: "12px 0",
            }}
          >
            <label
              style={{
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.mustChangePwd}
                onChange={(e) => {
                  set("mustChangePwd", e.target.checked);
                  if (e.target.checked) set("pwdNeverExpires", false);
                }}
              />
              User must change password at next logon
            </label>
            <label
              style={{
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.cantChangePwd}
                onChange={(e) => set("cantChangePwd", e.target.checked)}
              />
              User cannot change password
            </label>
            <label
              style={{
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.pwdNeverExpires}
                onChange={(e) => {
                  set("pwdNeverExpires", e.target.checked);
                  if (e.target.checked) set("mustChangePwd", false);
                }}
              />
              Password never expires
            </label>
            <label
              style={{
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.disabled}
                onChange={(e) => set("disabled", e.target.checked)}
              />
              Account is disabled
            </label>
          </div>
        </>
      )}

      {/* ── STEP 3: Summary ── */}
      {step === 3 && (
        <div style={{ fontSize: 13 }}>
          <div
            style={{
              background: T.greenBg,
              border: `1px solid #90d090`,
              borderRadius: 3,
              padding: "8px 12px",
              marginBottom: 14,
              color: T.green,
              fontWeight: 600,
            }}
          >
            ✓ Ready to create user. Click Finish to create the object.
          </div>
          {[
            ["Full Name", form.displayName],
            ["User Logon Name", `${form.username}@${DOMAIN}`],
            ["Organizational Unit", ouName],
            ["Must Change Password", form.mustChangePwd ? "Yes" : "No"],
            ["Password Never Expires", form.pwdNeverExpires ? "Yes" : "No"],
            ["Account Disabled", form.disabled ? "Yes" : "No"],
          ].map(([l, v]) => (
            <div
              key={l}
              style={{
                display: "flex",
                padding: "5px 0",
                borderBottom: `1px solid ${T.borderL}`,
              }}
            >
              <span style={{ width: 200, color: T.textSub, flexShrink: 0 }}>
                {l}:
              </span>
              <span style={{ fontWeight: 600 }}>{v || "—"}</span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
          paddingTop: 12,
          borderTop: `1px solid ${T.border}`,
        }}
      >
        {step > 1 && (
          <button onClick={() => setStep((s) => s - 1)} style={S.btnSecondary}>
            {"< Back"}
          </button>
        )}
        {step < 3 && (
          <button onClick={goNext} style={S.btnPrimary}>
            Next {">"}
          </button>
        )}
        {step === 3 && (
          <button onClick={finish} style={S.btnPrimary}>
            Finish
          </button>
        )}
        <button onClick={onClose} style={S.btnSecondary}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════
// USER PROPERTIES MODAL  (tabs like real ADUC)
// ════════════════════════════════════════════════════════
function UserPropertiesModal({ user, state, dispatch, onClose, logEvent }) {
  const [tab, setTab] = useState("General");
  const [form, setForm] = useState({ ...user });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    dispatch({ type: "UPDATE_USER", payload: form });
    logEvent(
      `User properties updated: ${form.username}`,
      "Information",
      "Directory Service",
      4738,
    );
    onClose();
  };

  const toggleMember = (gid) => {
    // update group members list too
    const grp = state.groups.find((g) => g.id === gid);
    if (!grp) return;
    const inGroup = (form.groups || []).includes(gid);
    set(
      "groups",
      inGroup
        ? (form.groups || []).filter((x) => x !== gid)
        : [...(form.groups || []), gid],
    );
    dispatch({
      type: "UPDATE_GROUP",
      payload: {
        ...grp,
        members: inGroup
          ? grp.members.filter((x) => x !== user.id)
          : [...grp.members, user.id],
      },
    });
  };

  return (
    <Modal
      title={`${user.firstName} ${user.lastName} Properties`}
      onClose={onClose}
      width={540}
      titleIcon={<span>👤</span>}
    >
      <Tabs
        tabs={["General", "Account", "Member Of", "Profile"]}
        active={tab}
        onChange={setTab}
      />

      {tab === "General" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <Field label="First name">
            <input
              style={S.input}
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </Field>
          <Field label="Last name">
            <input
              style={S.input}
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </Field>
          <Field label="Display name">
            <input
              style={S.input}
              value={form.displayName || `${form.firstName} ${form.lastName}`}
              onChange={(e) => set("displayName", e.target.value)}
            />
          </Field>
          <Field label="Description">
            <input
              style={S.input}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <Field label="Office">
            <input
              style={S.input}
              value={form.office || ""}
              onChange={(e) => set("office", e.target.value)}
            />
          </Field>
          <Field label="Telephone number">
            <input
              style={S.input}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              style={S.input}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Job title">
            <input
              style={S.input}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          <Field label="Department">
            <input
              style={S.input}
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
            />
          </Field>
        </div>
      )}

      {tab === "Account" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "end",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <Field label="User logon name (UPN)">
              <input
                style={S.input}
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
              />
            </Field>
            <span style={{ paddingBottom: 10, fontSize: 13, color: T.textSub }}>
              @
            </span>
            <Field label=" ">
              <input
                style={{ ...S.input, background: "#f5f5f5" }}
                value={DOMAIN}
                readOnly
              />
            </Field>
          </div>
          <div
            style={{
              border: `1px solid ${T.border}`,
              borderRadius: 2,
              padding: "10px 14px",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#444",
                marginBottom: 8,
              }}
            >
              Account options:
            </div>
            {[
              ["mustChangePwd", "User must change password at next logon"],
              ["cantChangePwd", "User cannot change password"],
              ["pwdNeverExpires", "Password never expires"],
              ["disabled", "Account is disabled"],
              ["locked", "Account is locked out"],
            ].map(([k, label]) => (
              <label
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  marginBottom: 6,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!form[k]}
                  onChange={(e) => set(k, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
          <Field label="Organizational Unit">
            <select
              style={S.input}
              value={form.ou}
              onChange={(e) => set("ou", e.target.value)}
            >
              {state.ous.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      {tab === "Member Of" && (
        <>
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 8 }}>
            Group memberships for {form.username}:
          </div>
          <div
            style={{
              border: `1px solid ${T.border}`,
              borderRadius: 2,
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  {["", "Name", "Type", "Domain"].map((h) => (
                    <th key={h} style={S.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.groups.map((g, i) => {
                  const inGroup = (form.groups || []).includes(g.id);
                  return (
                    <tr
                      key={g.id}
                      style={{
                        background: inGroup
                          ? "#e8f4fe"
                          : i % 2 === 0
                            ? "#fff"
                            : "#fafafa",
                      }}
                    >
                      <td style={{ ...S.td, width: 32, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={inGroup}
                          onChange={() => toggleMember(g.id)}
                        />
                      </td>
                      <td style={S.td}>{g.name}</td>
                      <td style={S.td}>{g.type}</td>
                      <td style={S.td}>{DOMAIN}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "Profile" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <Field label="Profile path">
            <input
              style={S.input}
              value={form.profilePath || ""}
              onChange={(e) => set("profilePath", e.target.value)}
              placeholder="\\server\profiles\%username%"
            />
          </Field>
          <Field label="Logon script">
            <input
              style={S.input}
              value={form.logonScript || ""}
              onChange={(e) => set("logonScript", e.target.value)}
              placeholder="logon.bat"
            />
          </Field>
          <Field label="Home folder — Local path">
            <input
              style={S.input}
              value={form.homePath || ""}
              onChange={(e) => set("homePath", e.target.value)}
            />
          </Field>
          <Field label="Connect drive">
            <input
              style={S.input}
              value={form.connectDrive || ""}
              onChange={(e) => set("connectDrive", e.target.value)}
              placeholder="H:"
            />
          </Field>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <button onClick={save} style={S.btnPrimary}>
          OK
        </button>
        <button onClick={onClose} style={S.btnSecondary}>
          Cancel
        </button>
        <button onClick={save} style={S.btnSecondary}>
          Apply
        </button>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════
// GROUP PROPERTIES MODAL
// ════════════════════════════════════════════════════════
function GroupPropertiesModal({ group, state, dispatch, onClose, logEvent }) {
  const [tab, setTab] = useState("General");
  const [form, setForm] = useState({ ...group });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    dispatch({ type: "UPDATE_GROUP", payload: form });
    logEvent(
      `Group updated: ${form.name}`,
      "Information",
      "Directory Service",
      4735,
    );
    onClose();
  };

  const toggleMember = (uid) => {
    const members = form.members || [];
    set(
      "members",
      members.includes(uid)
        ? members.filter((x) => x !== uid)
        : [...members, uid],
    );
  };

  return (
    <Modal
      title={`${group.name} Properties`}
      onClose={onClose}
      width={520}
      titleIcon={<span>👥</span>}
    >
      <Tabs
        tabs={["General", "Members", "Member Of"]}
        active={tab}
        onChange={setTab}
      />

      {tab === "General" && (
        <>
          <Field label="Group name">
            <input
              style={S.input}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Description">
            <input
              style={S.input}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              style={S.input}
              value={form.email || ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <div
            style={{
              border: `1px solid ${T.border}`,
              borderRadius: 2,
              padding: "10px 14px",
              marginTop: 10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              Group scope:
            </div>
            <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
              {["Domain Local", "Global", "Universal"].map((s) => (
                <label
                  key={s}
                  style={{
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={form.scope === s}
                    onChange={() => set("scope", s)}
                  />
                  {s}
                </label>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              Group type:
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              {["Security", "Distribution"].map((t) => (
                <label
                  key={t}
                  style={{
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    checked={form.type === t}
                    onChange={() => set("type", t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "Members" && (
        <>
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 8 }}>
            Members of {form.name}:
          </div>
          <div
            style={{
              border: `1px solid ${T.border}`,
              borderRadius: 2,
              maxHeight: 250,
              overflowY: "auto",
            }}
          >
            {state.users.map((u, i) => (
              <label
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "5px 10px",
                  cursor: "pointer",
                  background: (form.members || []).includes(u.id)
                    ? "#e8f4fe"
                    : i % 2 === 0
                      ? "#fff"
                      : "#fafafa",
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={(form.members || []).includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                />
                <span style={{ fontWeight: 600 }}>
                  {u.firstName} {u.lastName}
                </span>
                <span style={{ color: T.textMut }}>({u.username})</span>
              </label>
            ))}
          </div>
        </>
      )}

      {tab === "Member Of" && (
        <div
          style={{
            fontSize: 13,
            color: T.textSub,
            padding: 20,
            textAlign: "center",
          }}
        >
          Group nesting is managed through the parent group's Members tab.
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <button onClick={save} style={S.btnPrimary}>
          OK
        </button>
        <button onClick={onClose} style={S.btnSecondary}>
          Cancel
        </button>
        <button onClick={save} style={S.btnSecondary}>
          Apply
        </button>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════
// ICONS (SVG)
// ════════════════════════════════════════════════════════
const Ico = {
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  ),
  group: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  ),
  computer: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
    </svg>
  ),
  folder: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f5c400">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  ),
  ou: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#e8a000">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  ),
  domain: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  ),
  dc: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
    </svg>
  ),
  gpo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
  ),
  dns: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  ),
  event: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
    </svg>
  ),
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#2980b9">
      <circle cx="12" cy="12" r="10" />
      <path fill="#fff" d="M11 17h2v-6h-2zm0-8h2V7h-2z" />
    </svg>
  ),
  warn: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#e67e22">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  ),
  err: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#c0392b">
      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
    </svg>
  ),
  add: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  ),
  del: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  ),
  move: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 17H7l5 5 5-5h-4V3h-2z" />
    </svg>
  ),
  lock: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  ),
  pwd: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
  ),
};

// ════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════
// eslint-disable-next-line no-unused-vars
function Dashboard({ state }) {
  const stats = [
    {
      label: "Domain Controllers",
      value: state.domainControllers.length,
      color: T.blue2,
      icon: Ico.dc,
    },
    {
      label: "Users",
      value: state.users.length,
      color: "#107c10",
      icon: Ico.user,
    },
    {
      label: "Computers",
      value: state.computers.length,
      color: "#5c2d91",
      icon: Ico.computer,
    },
    {
      label: "Groups",
      value: state.groups.length,
      color: "#e65100",
      icon: Ico.group,
    },
    {
      label: "GPOs",
      value: state.gpos.length,
      color: "#1565c0",
      icon: Ico.gpo,
    },
    {
      label: "OUs / Containers",
      value: state.ous.length,
      color: "#00695c",
      icon: Ico.ou,
    },
  ];
  const issues = [
    {
      label: "Disabled Accounts",
      val: state.users.filter((u) => !u.enabled || u.disabled).length,
      color: T.textSub,
      bg: "#ececec",
    },
    {
      label: "Locked Out",
      val: state.users.filter((u) => u.locked).length,
      color: T.red,
      bg: T.redBg,
    },
    {
      label: "Password Expired",
      val: state.users.filter((u) => u.pwdExpired).length,
      color: T.amber,
      bg: T.amberBg,
    },
    {
      label: "Must Change Password",
      val: state.users.filter((u) => u.mustChangePwd).length,
      color: T.amber,
      bg: T.amberBg,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.textMut }}>
          Active Directory Domain Services
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>
          {state.domain}
        </div>
        <div style={{ fontSize: 12, color: T.textSub }}>
          Forest Functional Level: Windows Server 2022 &nbsp;·&nbsp; Domain
          Functional Level: Windows Server 2022
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          marginBottom: 18,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 4,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: shadow,
            }}
          >
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: s.color,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: 14,
            boxShadow: shadow,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
            Account Health
          </div>
          {issues.map((a) => (
            <div
              key={a.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderBottom: `1px solid ${T.borderL}`,
                fontSize: 13,
              }}
            >
              <span style={{ color: T.textSub }}>{a.label}</span>
              <Badge label={a.val} bg={a.bg} color={a.color} />
            </div>
          ))}
        </div>
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: 14,
            boxShadow: shadow,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
            Domain Controllers
          </div>
          {state.domainControllers.map((dc) => (
            <div
              key={dc.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "5px 0",
                borderBottom: `1px solid ${T.borderL}`,
                fontSize: 13,
              }}
            >
              <span style={{ color: T.green }}>●</span>
              <strong style={{ minWidth: 50 }}>{dc.name}</strong>
              <span style={{ color: T.textSub, flex: 1, fontSize: 12 }}>
                {dc.ip}
              </span>
              <span style={{ fontSize: 11, color: T.textMut }}>
                Up {dc.uptime}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          padding: 14,
          boxShadow: shadow,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
          Recent Events
        </div>
        {state.events.slice(0, 5).map((ev) => (
          <div
            key={ev.id}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              padding: "4px 0",
              borderBottom: `1px solid ${T.borderL}`,
              fontSize: 12,
            }}
          >
            <span style={{ marginTop: 1, flexShrink: 0 }}>
              {ev.level === "Error"
                ? Ico.err
                : ev.level === "Warning"
                  ? Ico.warn
                  : Ico.info}
            </span>
            <span style={{ color: T.textMut, minWidth: 140, flexShrink: 0 }}>
              {ev.time}
            </span>
            <span style={{ color: T.text }}>{ev.message.split("\n")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ADUC — main USERS & COMPUTERS view  (left tree + right pane)
// ════════════════════════════════════════════════════════
function ADUCView({ state, dispatch, logEvent }) {
  const [selectedNode, setSelectedNode] = useState("cn-users"); // Start on the populated Users container.
  const [expandedNodes, setExpandedNodes] = useState(new Set(["root"]));
  const [search, setSearch] = useState("");
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, target, type }
  const [modal, setModal] = useState(null); // { type, data }
  const [selectedRow, setSelectedRow] = useState(null);

  const toggleExpand = (id) => {
    setExpandedNodes((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // What to show in the right pane for a node
  const getRightPaneItems = () => {
    // Combine users, computers, groups, and child-ous
    const nodeId = selectedNode;
    const childOUs = state.ous.filter((o) => o.parent === nodeId);
    const users = state.users.filter((u) => u.ou === nodeId);
    const comps = state.computers.filter((c) => c.ou === nodeId);
    const groups = state.groups.filter((g) => g.ou === nodeId);
    const foreignPrincipals = (state.foreignSecurityPrincipals || []).filter(
      (principal) => nodeId === "cn-fsp",
    );
    const q = search.toLowerCase();

    const rows = [
      ...childOUs.map((o) => ({ ...o, _type: "ou" })),
      ...users.map((u) => ({
        ...u,
        _type: "user",
        displayName: `${u.firstName} ${u.lastName}`,
      })),
      ...comps.map((c) => ({ ...c, _type: "computer" })),
      ...groups.map((g) => ({ ...g, _type: "group" })),
      ...foreignPrincipals.map((principal) => ({
        ...principal,
        _type: "foreignPrincipal",
      })),
    ];
    if (!q) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  };

  const rightPaneItems = getRightPaneItems();

  // Tree node right-click
  const onTreeRightClick = (e, nodeId, nodeType) => {
    e.preventDefault();
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: "Delegate Control…",
          action: () => alert("Delegate Control wizard (simulated)"),
        },
        { label: "Move…", action: () => alert("Move container (simulated)") },
        { label: "Find…", action: () => alert("Find dialog (simulated)") },
        "---",
        {
          label: "New",
          sub: [
            {
              label: "Computer",
              action: () => setModal({ type: "newComputer", ou: nodeId }),
            },
            {
              label: "Contact",
              action: () => alert("New Contact (simulated)"),
            },
            {
              label: "Group",
              action: () => setModal({ type: "newGroup", ou: nodeId }),
            },
            {
              label: "InetOrgPerson",
              action: () => alert("New InetOrgPerson (simulated)"),
            },
            {
              label: "msDS-ShadowPrincipalContainer",
              action: () => alert("Not implemented"),
            },
            { label: "msImaging-PSPs", action: () => alert("Not implemented") },
            {
              label: "MSMQ Queue Alias",
              action: () => alert("Not implemented"),
            },
            {
              label: "Organizational Unit",
              action: () => setModal({ type: "newOU", parent: nodeId }),
            },
            {
              label: "Printer",
              action: () => alert("New Printer (simulated)"),
            },
            "---",
            {
              label: "User",
              action: () => setModal({ type: "newUser", ou: nodeId }),
            },
            {
              label: "Shared Folder",
              action: () => alert("New Shared Folder (simulated)"),
            },
          ],
        },
        "---",
        {
          label: "All Tasks",
          sub: [
            { label: "Move…", action: () => alert("Move (simulated)") },
            { label: "Find…", action: () => alert("Find (simulated)") },
          ],
        },
        { label: "Refresh", action: () => {} },
        {
          label: "Export List…",
          action: () => alert("Export List (simulated)"),
        },
        "---",
        {
          label: "View",
          sub: [
            { label: "Add/Remove Columns…", action: () => alert("Simulated") },
          ],
        },
        {
          label: "Arrange Icons",
          sub: [
            { label: "By Name", action: () => {} },
            { label: "By Type", action: () => {} },
          ],
        },
        { label: "Line up Icons", action: () => {} },
        "---",
        { label: "Properties", action: () => alert(`Properties of ${nodeId}`) },
        { label: "Help", action: () => alert("AD Help (simulated)") },
      ],
    });
  };

  // Row right-click  — matches Image 2 & 3 exactly
  const onRowRightClick = (e, item) => {
    e.preventDefault();
    setSelectedRow(item);
    const isUser = item._type === "user";
    const isGroup = item._type === "group";
    const isComp = item._type === "computer";
    const isOU = item._type === "ou";
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: isOU
        ? [
            {
              label: "Delegate Control…",
              action: () => alert("Delegate Control"),
            },
            { label: "Move…", action: () => alert("Move") },
            { label: "Find…", action: () => alert("Find") },
            "---",
            {
              label: "New",
              sub: [
                {
                  label: "Computer",
                  action: () => setModal({ type: "newComputer", ou: item.id }),
                },
                { label: "Contact", action: () => alert("New Contact") },
                {
                  label: "Group",
                  action: () => setModal({ type: "newGroup", ou: item.id }),
                },
                {
                  label: "Organizational Unit",
                  action: () => setModal({ type: "newOU", parent: item.id }),
                },
                "---",
                {
                  label: "User",
                  action: () => setModal({ type: "newUser", ou: item.id }),
                },
                {
                  label: "Shared Folder",
                  action: () => alert("New Shared Folder"),
                },
              ],
            },
            "---",
            {
              label: "Properties",
              action: () => alert(`OU Properties: ${item.name}`),
            },
          ]
        : isUser
          ? [
              {
                label: "Copy",
                action: () => alert(`Copy user ${item.username}`),
              },
              {
                label: "Add to a group…",
                action: () => setModal({ type: "addToGroup", user: item }),
              },
              {
                label: "Disable Account",
                action: () => {
                  dispatch({
                    type: "UPDATE_USER",
                    payload: { ...item, enabled: false, disabled: true },
                  });
                  logEvent(
                    `Account disabled: ${item.username}`,
                    "Information",
                    "Directory Service",
                    4725,
                  );
                },
                bold: !item.enabled,
              },
              {
                label: "Reset Password…",
                action: () => setModal({ type: "resetPwd", user: item }),
              },
              {
                label: "Move…",
                action: () => setModal({ type: "moveUser", user: item }),
              },
              "---",
              {
                label: "All Tasks",
                sub: [
                  {
                    label: "Disable Account",
                    action: () => {
                      dispatch({
                        type: "UPDATE_USER",
                        payload: { ...item, enabled: false },
                      });
                      logEvent(`Account disabled: ${item.username}`);
                    },
                  },
                  {
                    label: "Reset Password…",
                    action: () => setModal({ type: "resetPwd", user: item }),
                  },
                  {
                    label: "Add to a group…",
                    action: () => setModal({ type: "addToGroup", user: item }),
                  },
                ],
              },
              "---",
              {
                label: "Delete",
                action: () => {
                  if (window.confirm(`Delete user '${item.username}'?`)) {
                    dispatch({ type: "DELETE_USER", payload: item.id });
                    logEvent(
                      `User deleted: ${item.username}`,
                      "Information",
                      "Directory Service",
                      4726,
                    );
                  }
                },
                danger: true,
              },
              { label: "Rename", action: () => alert("Rename (simulated)") },
              { label: "Refresh", action: () => {} },
              { label: "Export List…", action: () => alert("Export") },
              "---",
              {
                label: "Properties",
                action: () => setModal({ type: "userProps", user: item }),
                bold: true,
              },
              { label: "Help", action: () => alert("Help") },
            ]
          : isGroup
            ? [
                {
                  label: "Add to a group…",
                  action: () => alert("Add group to another group"),
                },
                {
                  label: "Move…",
                  action: () => setModal({ type: "moveGroup", group: item }),
                },
                "---",
                {
                  label: "Delete",
                  action: () => {
                    if (window.confirm(`Delete group '${item.name}'?`)) {
                      dispatch({ type: "DELETE_GROUP", payload: item.id });
                      logEvent(`Group deleted: ${item.name}`);
                    }
                  },
                  danger: true,
                },
                { label: "Rename", action: () => alert("Rename (simulated)") },
                { label: "Refresh", action: () => {} },
                "---",
                {
                  label: "Properties",
                  action: () => setModal({ type: "groupProps", group: item }),
                  bold: true,
                },
              ]
            : isComp
              ? [
                  {
                    label: "Manage",
                    action: () => alert(`Manage computer: ${item.name}`),
                  },
                  {
                    label: "Reset Account",
                    action: () => {
                      if (
                        window.confirm(`Reset computer account '${item.name}'?`)
                      ) {
                        logEvent(`Computer account reset: ${item.name}`);
                      }
                    },
                  },
                  { label: "Move…", action: () => alert("Move") },
                  "---",
                  {
                    label: "Delete",
                    action: () => {
                      if (
                        window.confirm(`Remove '${item.name}' from domain?`)
                      ) {
                        dispatch({ type: "DELETE_COMPUTER", payload: item.id });
                        logEvent(`Computer removed: ${item.name}`);
                      }
                    },
                    danger: true,
                  },
                  "---",
                  {
                    label: "Properties",
                    action: () =>
                      setModal({ type: "computerProps", computer: item }),
                    bold: true,
                  },
                ]
              : [{ label: "Properties", action: () => {} }],
    });
  };

  // ── TREE NODE ──
  const TreeNode = ({ nodeId, depth = 0 }) => {
    const children = state.ous.filter((o) => o.parent === nodeId);
    const isSelected = selectedNode === nodeId;
    const isExpanded = expandedNodes.has(nodeId ?? "root");
    const node = nodeId ? state.ous.find((o) => o.id === nodeId) : null;
    const label = node ? node.name : state.domain;
    const hasChildren = children.length > 0;
    const nodeType = node?.type || "domain";
    const icon = !node ? Ico.domain : nodeType === "ou" ? Ico.ou : Ico.folder;

    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: "2px 0",
            paddingLeft: 4 + depth * 14,
            cursor: "pointer",
            background: isSelected ? "#cde8ff" : "transparent",
            userSelect: "none",
          }}
          onClick={() => setSelectedNode(nodeId)}
          onContextMenu={(e) => onTreeRightClick(e, nodeId, nodeType)}
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(nodeId ?? "root");
            }}
            style={{
              width: 14,
              textAlign: "center",
              fontSize: 9,
              color: "#888",
              flexShrink: 0,
            }}
          >
            {hasChildren ? (isExpanded ? "▼" : "▶") : " "}
          </span>
          <span style={{ flexShrink: 0 }}>{icon}</span>
          <span
            style={{
              fontSize: 13,
              color: isSelected ? T.navy : T.text,
              fontWeight: isSelected ? 700 : 400,
              marginLeft: 4,
            }}
          >
            {label}
          </span>
        </div>
        {isExpanded &&
          children.map((child) => (
            <TreeNode key={child.id} nodeId={child.id} depth={depth + 1} />
          ))}
      </div>
    );
  };

  const getTypeLabel = (item) => {
    if (item._type === "user") return item.builtin ? "User" : "User";
    if (item._type === "group")
      return `Security Group - ${item.scope || "Global"}`;
    if (item._type === "computer") return "Computer";
    if (item._type === "foreignPrincipal") return "Foreign Security Principal";
    if (item._type === "ou") return "Organizational Unit";
    return "";
  };

  const getTypeIcon = (item) => {
    if (item._type === "user")
      return <span style={{ color: T.blue2 }}>{Ico.user}</span>;
    if (item._type === "group")
      return <span style={{ color: "#e65100" }}>{Ico.group}</span>;
    if (item._type === "computer")
      return <span style={{ color: T.purple }}>{Ico.computer}</span>;
    if (item._type === "foreignPrincipal")
      return <span style={{ color: T.amber }}>🔗</span>;
    if (item._type === "ou") return Ico.ou;
    return null;
  };

  const nodeName = selectedNode
    ? state.ous.find((o) => o.id === selectedNode)?.name
    : state.domain;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: T.surface,
      }}
    >
      {/* Toolbar — matches ADUC toolbar */}
      <div
        style={{
          background: "#f0f0f0",
          borderBottom: `1px solid ${T.border}`,
          padding: "3px 6px",
          display: "flex",
          gap: 3,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {[
          { title: "Back", icon: "◀" },
          { title: "Forward", icon: "▶" },
          { title: "Up one level", icon: "↑" },
          null,
          {
            title: "Find in this domain",
            icon: "🔍",
            action: () => alert("Find dialog (simulated)"),
          },
          null,
          {
            title: "New User",
            icon: "👤+",
            action: () => setModal({ type: "newUser", ou: selectedNode }),
          },
          {
            title: "New Group",
            icon: "👥+",
            action: () => setModal({ type: "newGroup", ou: selectedNode }),
          },
          {
            title: "New OU",
            icon: "📁+",
            action: () => setModal({ type: "newOU", parent: selectedNode }),
          },
          {
            title: "New Computer",
            icon: "💻+",
            action: () => setModal({ type: "newComputer", ou: selectedNode }),
          },
          null,
          {
            title: "Properties",
            icon: "📋",
            action: () =>
              selectedRow &&
              setModal({
                type: selectedRow._type + "Props",
                [selectedRow._type]: selectedRow,
              }),
          },
          {
            title: "Delete",
            icon: "🗑️",
            action: () => alert("Select an object first"),
          },
          {
            title: "Move",
            icon: "➡️",
            action: () => alert("Move (simulated)"),
          },
          null,
          { title: "Refresh", icon: "🔄", action: () => {} },
        ].map((btn, i) =>
          btn === null ? (
            <div
              key={i}
              style={{
                width: 1,
                height: 20,
                background: T.border,
                margin: "0 3px",
              }}
            />
          ) : (
            <ToolbarBtn key={i} title={btn.title} onClick={btn.action}>
              <span style={{ fontSize: 13 }}>{btn.icon}</span>
            </ToolbarBtn>
          ),
        )}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "#fff",
            border: `1px solid ${T.border}`,
            borderRadius: 2,
            padding: "2px 6px",
          }}
        >
          {Ico.search}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search current container..."
            style={{
              border: "none",
              outline: "none",
              fontSize: 12,
              width: 180,
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left tree */}
        <div
          style={{
            width: 240,
            borderRight: `1px solid ${T.border}`,
            overflowY: "auto",
            padding: "4px 0",
            flexShrink: 0,
          }}
        >
          {/* Saved Queries */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 8px",
              fontSize: 13,
              color: T.text,
              cursor: "pointer",
            }}
            onClick={() => setSelectedNode("saved-queries")}
          >
            <span style={{ width: 14 }}> </span>
            <span>📂</span>
            <span style={{ marginLeft: 4 }}>Saved Queries</span>
          </div>
          {/* Domain root */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: "3px 8px",
              cursor: "pointer",
              background: selectedNode === null ? "#cde8ff" : "transparent",
            }}
            onClick={() => setSelectedNode(null)}
            onContextMenu={(e) => onTreeRightClick(e, null, "domain")}
          >
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand("root");
              }}
              style={{
                width: 14,
                textAlign: "center",
                fontSize: 9,
                color: "#888",
              }}
            >
              {expandedNodes.has("root") ? "▼" : "▶"}
            </span>
            <span>{Ico.domain}</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: selectedNode === null ? T.navy : T.text,
                marginLeft: 4,
              }}
            >
              Active Directory Users and Comp…
            </span>
          </div>
          {expandedNodes.has("root") && (
            <div style={{ paddingLeft: 14 }}>
              {/* Domain node */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  padding: "2px 8px",
                  cursor: "pointer",
                  background:
                    selectedNode === "domain" ? "#cde8ff" : "transparent",
                }}
                onClick={() => setSelectedNode("domain")}
                onContextMenu={(e) => onTreeRightClick(e, "domain", "domain")}
              >
                <span
                  style={{
                    width: 14,
                    textAlign: "center",
                    fontSize: 9,
                    color: "#888",
                  }}
                >
                  {expandedNodes.has("domain") ? "▼" : "▶"}
                </span>
                <span>{Ico.domain}</span>
                <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 4 }}>
                  {state.domain}
                </span>
              </div>
              {/* All OUs/containers with parent=null */}
              {state.ous
                .filter((o) => o.parent === null)
                .map((o) => (
                  <TreeNode key={o.id} nodeId={o.id} depth={1} />
                ))}
            </div>
          )}
        </div>

        {/* Right pane */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Column headers */}
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "#f3f5f7" }}>
                <th style={{ ...S.th, width: 28 }}></th>
                <th style={{ ...S.th, minWidth: 200 }}>Name</th>
                <th style={{ ...S.th, minWidth: 180 }}>Type</th>
                <th style={{ ...S.th }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {rightPaneItems.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      ...S.td,
                      textAlign: "center",
                      color: T.textMut,
                      padding: 30,
                    }}
                  >
                    {selectedNode === null
                      ? "Select a container in the left panel."
                      : "This container is empty. Right-click to add objects."}
                  </td>
                </tr>
              )}
              {rightPaneItems.map((item, i) => (
                <tr
                  key={item.id || i}
                  onContextMenu={(e) => onRowRightClick(e, item)}
                  onDoubleClick={() => {
                    if (item._type === "user")
                      setModal({ type: "userProps", user: item });
                    if (item._type === "group")
                      setModal({ type: "groupProps", group: item });
                    if (item._type === "ou") setSelectedNode(item.id);
                  }}
                  onClick={() => setSelectedRow(item)}
                  style={{
                    background:
                      selectedRow?.id === item.id
                        ? "#cde8ff"
                        : i % 2 === 0
                          ? "#fff"
                          : "#f9fbfd",
                    cursor: "default",
                    userSelect: "none",
                  }}
                >
                  <td style={{ ...S.td, width: 28, textAlign: "center" }}>
                    {getTypeIcon(item)}
                  </td>
                  <td style={{ ...S.td, fontWeight: 600 }}>
                    {item._type === "user"
                      ? `${item.firstName} ${item.lastName}`
                      : item.name}
                  </td>
                  <td style={{ ...S.td, color: T.textSub }}>
                    {getTypeLabel(item)}
                  </td>
                  <td style={{ ...S.td, color: T.textMut }}>
                    {item.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          background: "#f0f0f0",
          borderTop: `1px solid ${T.border}`,
          padding: "2px 10px",
          fontSize: 12,
          color: T.textSub,
          display: "flex",
          gap: 16,
        }}
      >
        <span>
          {nodeName} — {rightPaneItems.length} object
          {rightPaneItems.length !== 1 ? "s" : ""}
        </span>
        {selectedRow && (
          <span>
            Selected:{" "}
            {selectedRow._type === "user"
              ? `${selectedRow.firstName} ${selectedRow.lastName}`
              : selectedRow.name}
          </span>
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Modals */}
      {modal?.type === "newUser" && (
        <NewUserWizard
          state={state}
          dispatch={dispatch}
          logEvent={logEvent}
          defaultOU={modal.ou}
          onSave={(u) => {
            dispatch({ type: "ADD_USER", payload: u });
            logEvent(
              `New user created: ${u.username}`,
              "Information",
              "Directory Service",
              4720,
            );
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "userProps" && (
        <UserPropertiesModal
          user={modal.user}
          state={state}
          dispatch={dispatch}
          logEvent={logEvent}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "groupProps" && (
        <GroupPropertiesModal
          group={modal.group}
          state={state}
          dispatch={dispatch}
          logEvent={logEvent}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "newGroup" && (
        <Modal
          title="New Object - Group"
          onClose={() => setModal(null)}
          titleIcon={<span>👥</span>}
        >
          <NewGroupForm
            state={state}
            dispatch={dispatch}
            logEvent={logEvent}
            defaultOU={modal.ou}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === "newOU" && (
        <Modal
          title="New Object - Organizational Unit"
          onClose={() => setModal(null)}
          titleIcon={Ico.ou}
        >
          <NewOUForm
            state={state}
            dispatch={dispatch}
            logEvent={logEvent}
            parentId={modal.parent}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === "newComputer" && (
        <Modal
          title="New Object - Computer"
          onClose={() => setModal(null)}
          titleIcon={<span>💻</span>}
        >
          <NewComputerForm
            state={state}
            dispatch={dispatch}
            logEvent={logEvent}
            defaultOU={modal.ou}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === "resetPwd" && (
        <Modal
          title={`Reset Password — ${modal.user.username}`}
          onClose={() => setModal(null)}
          titleIcon={Ico.pwd}
          width={400}
        >
          <ResetPasswordForm
            user={modal.user}
            dispatch={dispatch}
            logEvent={logEvent}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === "addToGroup" && (
        <Modal
          title={`Add to Group — ${modal.user.firstName} ${modal.user.lastName}`}
          onClose={() => setModal(null)}
          titleIcon={Ico.group}
          width={440}
        >
          <AddToGroupForm
            user={modal.user}
            state={state}
            dispatch={dispatch}
            logEvent={logEvent}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === "moveUser" && (
        <Modal
          title={`Move Object — ${modal.user.username}`}
          onClose={() => setModal(null)}
          width={400}
        >
          <MoveObjectForm
            obj={modal.user}
            objType="user"
            state={state}
            dispatch={dispatch}
            logEvent={logEvent}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// ── Inline sub-forms used by modals ──
function NewGroupForm({ state, dispatch, logEvent, defaultOU, onClose }) {
  const [form, setForm] = useState({
    name: "",
    type: "Security",
    scope: "Global",
    ou: defaultOU || "cn-users",
    description: "",
    email: "",
    members: [],
  });
  const save = () => {
    const g = { ...form, id: newId("g") };
    dispatch({ type: "ADD_GROUP", payload: g });
    logEvent(
      `Group created: ${g.name}`,
      "Information",
      "Directory Service",
      4727,
    );
    onClose();
  };
  return (
    <>
      <div
        style={{
          fontSize: 12,
          color: T.textSub,
          background: "#f5f7fa",
          border: `1px solid ${T.borderL}`,
          borderRadius: 2,
          padding: "5px 10px",
          marginBottom: 14,
        }}
      >
        <span>👥</span> Create in:{" "}
        <strong>
          {DOMAIN}/{state.ous.find((o) => o.id === form.ou)?.name || "Users"}
        </strong>
      </div>
      <Field label="Group name (pre-Windows 2000):">
        <input
          style={S.input}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </Field>
      <Field label="Description:">
        <input
          style={S.input}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </Field>
      <Field label="E-mail:">
        <input
          style={S.input}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </Field>
      <Field label="Organizational Unit:">
        <select
          style={S.input}
          value={form.ou}
          onChange={(e) => setForm((f) => ({ ...f, ou: e.target.value }))}
        >
          {state.ous.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </Field>
      <div
        style={{
          border: `1px solid ${T.border}`,
          borderRadius: 2,
          padding: "10px 14px",
          marginTop: 8,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          Group scope:
        </div>
        <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
          {["Domain Local", "Global", "Universal"].map((s) => (
            <label
              key={s}
              style={{
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <input
                type="radio"
                name="scope"
                checked={form.scope === s}
                onChange={() => setForm((f) => ({ ...f, scope: s }))}
              />
              {s}
            </label>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          Group type:
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Security", "Distribution"].map((t) => (
            <label
              key={t}
              style={{
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <input
                type="radio"
                name="type"
                checked={form.type === t}
                onChange={() => setForm((f) => ({ ...f, type: t }))}
              />
              {t}
            </label>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
        }}
      >
        <button onClick={onClose} style={S.btnSecondary}>
          Cancel
        </button>
        <button onClick={save} style={S.btnPrimary}>
          OK
        </button>
      </div>
    </>
  );
}

function NewOUForm({ state, dispatch, logEvent, parentId, onClose }) {
  const [name, setName] = useState("");
  const [protect, setProtect] = useState(true);
  const save = () => {
    const parentOU = state.ous.find((o) => o.id === parentId);
    const ou = {
      id: newId("ou"),
      name,
      parent: parentId,
      type: "ou",
      path: `OU=${name},${parentOU?.path || `DC=jeffery,DC=local`}`,
      protected: false,
    };
    dispatch({ type: "ADD_OU", payload: ou });
    logEvent(`OU created: ${name}`, "Information", "Directory Service", 5136);
    onClose();
  };
  return (
    <>
      <Field label="Name:">
        <input
          style={S.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <label
        style={{
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
        }}
      >
        <input
          type="checkbox"
          checked={protect}
          onChange={(e) => setProtect(e.target.checked)}
        />
        Protect container from accidental deletion
      </label>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
        }}
      >
        <button onClick={onClose} style={S.btnSecondary}>
          Cancel
        </button>
        <button onClick={save} style={S.btnPrimary}>
          OK
        </button>
      </div>
    </>
  );
}

function NewComputerForm({ state, dispatch, logEvent, defaultOU, onClose }) {
  const [form, setForm] = useState({
    name: "",
    os: "Windows 11 Pro",
    ip: "",
    ou: defaultOU || "cn-computers",
    description: "",
  });
  const save = () => {
    const c = { ...form, id: newId("c"), status: "Active", lastLogon: "Never" };
    dispatch({ type: "ADD_COMPUTER", payload: c });
    logEvent(
      `Computer joined domain: ${c.name}`,
      "Information",
      "Directory Service",
      4741,
    );
    onClose();
  };
  return (
    <>
      <Field label="Computer name:">
        <input
          style={S.input}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. WS-SMITH-01"
        />
      </Field>
      <Field label="Computer name (pre-Windows 2000):">
        <input
          style={{ ...S.input, background: "#f5f5f5" }}
          value={form.name}
          readOnly
        />
      </Field>
      <Field label="Operating System:">
        <select
          style={S.input}
          value={form.os}
          onChange={(e) => setForm((f) => ({ ...f, os: e.target.value }))}
        >
          {[
            "Windows 11 Pro",
            "Windows 10 Pro",
            "Windows Server 2022",
            "Windows Server 2019",
            "Windows Server 2016",
          ].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Field>
      <Field label="IP Address:">
        <input
          style={S.input}
          value={form.ip}
          onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))}
          placeholder="192.168.1.x"
        />
      </Field>
      <Field label="Organizational Unit:">
        <select
          style={S.input}
          value={form.ou}
          onChange={(e) => setForm((f) => ({ ...f, ou: e.target.value }))}
        >
          {state.ous.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Description:">
        <input
          style={S.input}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </Field>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
        }}
      >
        <button onClick={onClose} style={S.btnSecondary}>
          Cancel
        </button>
        <button onClick={save} style={S.btnPrimary}>
          OK
        </button>
      </div>
    </>
  );
}

function ResetPasswordForm({ user, dispatch, logEvent, onClose }) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mustChange, setMustChange] = useState(true);
  const [err, setErr] = useState("");
  const save = () => {
    if (pwd !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    if (pwd.length < 7) {
      setErr("Password must be at least 7 characters.");
      return;
    }
    dispatch({
      type: "UPDATE_USER",
      payload: {
        ...user,
        mustChangePwd: mustChange,
        locked: false,
        pwdExpired: false,
      },
    });
    logEvent(
      `Password reset for: ${user.username}`,
      "Information",
      "Security",
      4723,
    );
    onClose();
  };
  return (
    <>
      <Field label="New password:">
        <input
          style={S.input}
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
      </Field>
      <Field label="Confirm password:">
        <input
          style={S.input}
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      {err && (
        <div
          style={{
            color: T.red,
            fontSize: 12,
            padding: "4px 8px",
            background: T.redBg,
            borderRadius: 2,
            marginBottom: 8,
          }}
        >
          {err}
        </div>
      )}
      <label
        style={{
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 4,
        }}
      >
        <input
          type="checkbox"
          checked={mustChange}
          onChange={(e) => setMustChange(e.target.checked)}
        />
        User must change password at next logon
      </label>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
        }}
      >
        <button onClick={onClose} style={S.btnSecondary}>
          Cancel
        </button>
        <button onClick={save} style={S.btnPrimary}>
          OK
        </button>
      </div>
    </>
  );
}

function AddToGroupForm({ user, state, dispatch, logEvent, onClose }) {
  const [selected, setSelected] = useState([]);
  const toggle = (gid) =>
    setSelected((s) =>
      s.includes(gid) ? s.filter((x) => x !== gid) : [...s, gid],
    );
  const save = () => {
    const newGroups = [...new Set([...(user.groups || []), ...selected])];
    dispatch({ type: "UPDATE_USER", payload: { ...user, groups: newGroups } });
    selected.forEach((gid) => {
      const g = state.groups.find((x) => x.id === gid);
      if (g && !g.members.includes(user.id))
        dispatch({
          type: "UPDATE_GROUP",
          payload: { ...g, members: [...g.members, user.id] },
        });
    });
    logEvent(
      `${user.username} added to groups: ${selected.map((gid) => state.groups.find((g) => g.id === gid)?.name).join(", ")}`,
    );
    onClose();
  };
  return (
    <>
      <div style={{ fontSize: 13, marginBottom: 10 }}>
        Select groups to add <strong>{user.username}</strong> to:
      </div>
      <div
        style={{
          border: `1px solid ${T.border}`,
          borderRadius: 2,
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {state.groups.map((g, i) => (
          <label
            key={g.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "5px 10px",
              cursor: "pointer",
              background: selected.includes(g.id)
                ? "#e8f4fe"
                : i % 2 === 0
                  ? "#fff"
                  : "#fafafa",
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(g.id)}
              onChange={() => toggle(g.id)}
            />
            <span style={{ fontWeight: 600 }}>{g.name}</span>
            <span style={{ color: T.textMut }}>({g.scope})</span>
          </label>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 14,
        }}
      >
        <button onClick={onClose} style={S.btnSecondary}>
          Cancel
        </button>
        <button onClick={save} style={S.btnPrimary}>
          OK
        </button>
      </div>
    </>
  );
}

function MoveObjectForm({ obj, objType, state, dispatch, logEvent, onClose }) {
  const [targetOU, setTargetOU] = useState(obj.ou || "cn-users");
  const [expanded, setExpanded] = useState(new Set(["root"]));

  const toggleExp = (id) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // All the real AD system containers shown in Image 1
  const systemContainers = [
    { id: "cn-builtin", name: "Builtin", icon: "📁" },
    { id: "cn-computers", name: "Computers", icon: "📁" },
    { id: "cn-dc", name: "Domain Controllers", icon: "📁" },
    { id: "cn-employees", name: "Employees", icon: "📁" },
    { id: "cn-fsp", name: "ForeignSecurityPrincipals", icon: "📁" },
    { id: "cn-keys", name: "Keys", icon: "📁" },
    { id: "cn-laf", name: "LostAndFound", icon: "📁" },
    { id: "cn-msa", name: "Managed Service Accounts", icon: "📁" },
    { id: "cn-ntdsq", name: "NTDS Quotas", icon: "📁" },
    { id: "cn-progdata", name: "Program Data", icon: "📁" },
    { id: "cn-system", name: "System", icon: "📁" },
    { id: "cn-users", name: "Users", icon: "📁" },
  ];

  // Merge real OUs from state with system containers for the tree
  const allContainers = [
    ...systemContainers,
    ...state.ous.filter((o) => !systemContainers.find((s) => s.id === o.id)),
  ];

  const save = () => {
    dispatch({
      type: objType === "user" ? "UPDATE_USER" : "UPDATE_COMPUTER",
      payload: { ...obj, ou: targetOU },
    });
    logEvent(
      `${objType} moved to ${allContainers.find((o) => o.id === targetOU)?.name || targetOU}: ${obj.username || obj.name}`,
    );
    onClose();
  };

  const MoveTreeNode = ({ nodeId, depth = 0 }) => {
    const node = allContainers.find((o) => o.id === nodeId);
    if (!node) return null;
    const children = state.ous.filter((o) => o.parent === nodeId);
    const isExp = expanded.has(nodeId);
    const isSel = targetOU === nodeId;
    return (
      <div>
        <div
          onClick={() => setTargetOU(nodeId)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: "2px 4px",
            paddingLeft: 4 + depth * 16,
            background: isSel ? "#0055a4" : "transparent",
            color: isSel ? "#fff" : "#000",
            cursor: "pointer",
            userSelect: "none",
            fontSize: 13,
          }}
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              toggleExp(nodeId);
            }}
            style={{
              width: 14,
              fontSize: 9,
              color: isSel ? "#fff" : "#666",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            {children.length > 0 ? (isExp ? "▼" : "▶") : " "}
          </span>
          <span style={{ fontSize: 13, marginRight: 3 }}>📁</span>
          {node.name}
        </div>
        {isExp &&
          children.map((c) => (
            <MoveTreeNode key={c.id} nodeId={c.id} depth={depth + 1} />
          ))}
      </div>
    );
  };

  return (
    <>
      <div style={{ fontSize: 13, marginBottom: 10, color: T.textSub }}>
        Move object into container:
      </div>
      <div
        style={{
          border: `1px solid ${T.border}`,
          borderRadius: 2,
          height: 240,
          overflowY: "auto",
          background: "#fff",
          padding: 4,
        }}
      >
        {/* Domain root node */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: "2px 4px",
            fontSize: 13,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() =>
            setExpanded((s) => {
              const n = new Set(s);
              n.has("root") ? n.delete("root") : n.add("root");
              return n;
            })
          }
        >
          <span
            style={{
              width: 14,
              fontSize: 9,
              color: "#666",
              textAlign: "center",
            }}
          >
            {expanded.has("root") ? "▼" : "▶"}
          </span>
          <span>🌐</span>
          <span style={{ fontWeight: 600, marginLeft: 3 }}>
            {state.domain.split(".")[0]}
          </span>
        </div>
        {/* All containers under root */}
        {expanded.has("root") &&
          allContainers.map((c) => (
            <MoveTreeNode key={c.id} nodeId={c.id} depth={1} />
          ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 14,
        }}
      >
        <button onClick={save} style={S.btnPrimary}>
          OK
        </button>
        <button onClick={onClose} style={S.btnSecondary}>
          Cancel
        </button>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════
// GPO
// ════════════════════════════════════════════════════════
function GPOView({ state, dispatch, logEvent }) {
  const [modal, setModal] = useState(null);
  const [viewGPO, setViewGPO] = useState(null);
  const [form, setForm] = useState({});

  const save = () => {
    const g = {
      ...form,
      id: newId("gpo"),
      status: "Enabled",
      settings: (form.settingsText || "").split("\n").filter(Boolean),
    };
    dispatch({ type: "ADD_GPO", payload: g });
    logEvent(`GPO created: ${g.name}`, "Information", "GroupPolicy", 5136);
    setModal(null);
  };

  return (
    <div>
      <ViewHint>
        Group Policy Objects apply centralized settings to users and computers.
        Linking a GPO to an OU determines which directory objects inherit its
        rules.
      </ViewHint>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 700, color: T.navy, fontSize: 15 }}>
          Group Policy Management
        </div>
        <button
          onClick={() => {
            setForm({
              name: "",
              linkedTo: "",
              description: "",
              settingsText: "",
            });
            setModal("add");
          }}
          style={{
            ...S.btnPrimary,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          {Ico.add} New GPO
        </button>
      </div>

      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: shadow,
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              {["GPO Name", "Linked To", "Status", "Settings", "Actions"].map(
                (h) => (
                  <th key={h} style={S.th}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {state.gpos.map((g, i) => (
              <tr
                key={g.id}
                style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
              >
                <td style={S.td}>
                  <button
                    onClick={() => setViewGPO(g)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: T.blue2,
                      fontWeight: 700,
                      fontSize: 13,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {Ico.gpo} {g.name}
                  </button>
                </td>
                <td style={S.td}>
                  <Badge
                    label={
                      state.ous.find((o) => o.id === g.linkedTo)?.name ||
                      "Domain Root"
                    }
                    bg="#e8f0fe"
                    color="#1a3c8f"
                  />
                </td>
                <td style={S.td}>
                  <Badge
                    label={g.status}
                    bg={g.status === "Enabled" ? T.greenBg : "#ececec"}
                    color={g.status === "Enabled" ? T.green : "#666"}
                  />
                </td>
                <td style={S.td}>
                  <Badge
                    label={g.settings.length + " settings"}
                    bg="#f0f0f0"
                    color="#444"
                  />
                </td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button
                      onClick={() => {
                        dispatch({ type: "TOGGLE_GPO", payload: g.id });
                        logEvent(
                          `GPO ${g.status === "Enabled" ? "disabled" : "enabled"}: ${g.name}`,
                        );
                      }}
                      style={{ ...S.btnSecondary, fontSize: 11 }}
                    >
                      {g.status === "Enabled" ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete GPO '${g.name}'?`)) {
                          dispatch({ type: "DELETE_GPO", payload: g.id });
                          logEvent(`GPO deleted: ${g.name}`);
                        }
                      }}
                      style={{ ...S.btnDanger, padding: "4px 8px" }}
                    >
                      {Ico.del}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === "add" && (
        <Modal
          title="Create New Group Policy Object"
          onClose={() => setModal(null)}
          titleIcon={Ico.gpo}
        >
          <Field label="GPO Name:">
            <input
              style={S.input}
              value={form.name || ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Link to OU:">
            <select
              style={S.input}
              value={form.linkedTo || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, linkedTo: e.target.value }))
              }
            >
              <option value="">Domain Root</option>
              {state.ous.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Comment:">
            <input
              style={S.input}
              value={form.description || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </Field>
          <Field label="Policy Settings (one per line):">
            <textarea
              style={{ ...S.input, minHeight: 90, resize: "vertical" }}
              value={form.settingsText || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, settingsText: e.target.value }))
              }
              placeholder={
                "Password min length: 12\nScreen lock: 15 minutes\nWindows Firewall: Enabled"
              }
            />
          </Field>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 12,
            }}
          >
            <button onClick={() => setModal(null)} style={S.btnSecondary}>
              Cancel
            </button>
            <button onClick={save} style={S.btnPrimary}>
              OK
            </button>
          </div>
        </Modal>
      )}

      {viewGPO && (
        <Modal
          title={viewGPO.name}
          onClose={() => setViewGPO(null)}
          titleIcon={Ico.gpo}
          width={560}
        >
          <Tabs
            tabs={["Scope", "Details", "Settings", "Delegation"]}
            active="Settings"
            onChange={() => {}}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {[
              ["Name", viewGPO.name],
              ["Status", viewGPO.status],
              [
                "Linked To",
                state.ous.find((o) => o.id === viewGPO.linkedTo)?.name ||
                  "Domain Root",
              ],
              ["Description", viewGPO.description || "—"],
            ].map(([l, v]) => (
              <div key={l}>
                <span style={{ color: T.textSub, fontSize: 12 }}>{l}</span>
                <div style={{ fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 12,
              color: T.textSub,
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            Configured Policy Settings:
          </div>
          {viewGPO.settings.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "5px 10px",
                background: "#f5f5f5",
                borderLeft: `3px solid ${T.blue2}`,
                marginBottom: 4,
                fontSize: 13,
                borderRadius: 2,
              }}
            >
              {s}
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <button onClick={() => setViewGPO(null)} style={S.btnSecondary}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// DNS
// ════════════════════════════════════════════════════════
function DNSView({ state }) {
  const [selectedZone, setSelectedZone] = useState(state.dnsZones[0]);
  return (
    <div>
      <div
        style={{
          fontWeight: 700,
          color: T.navy,
          fontSize: 15,
          marginBottom: 12,
        }}
      >
        DNS Manager — {DC_NAME}.{DOMAIN}
      </div>
      <ViewHint>
        DNS translates names such as <strong>{DOMAIN}</strong> into IP
        addresses. Forward zones resolve names to addresses; reverse zones do
        the opposite.
      </ViewHint>
      <div
        style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12 }}
      >
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: 6,
            boxShadow: shadow,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: T.textSub,
              padding: "3px 8px",
              marginBottom: 4,
            }}
          >
            DNS SERVER
          </div>
          <div
            style={{
              padding: "4px 8px",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {Ico.dc} {DC_NAME}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: T.textSub,
              padding: "4px 8px 2px",
              marginTop: 4,
            }}
          >
            Forward Lookup Zones
          </div>
          {state.dnsZones
            .filter((z) => !z.name.includes("in-addr"))
            .map((z) => (
              <div
                key={z.id}
                onClick={() => setSelectedZone(z)}
                style={{
                  padding: "3px 8px 3px 22px",
                  cursor: "pointer",
                  borderRadius: 2,
                  background:
                    selectedZone?.id === z.id ? "#cde8ff" : "transparent",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {Ico.dns} {z.name}
              </div>
            ))}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: T.textSub,
              padding: "6px 8px 2px",
              marginTop: 4,
            }}
          >
            Reverse Lookup Zones
          </div>
          {state.dnsZones
            .filter((z) => z.name.includes("in-addr"))
            .map((z) => (
              <div
                key={z.id}
                onClick={() => setSelectedZone(z)}
                style={{
                  padding: "3px 8px 3px 22px",
                  cursor: "pointer",
                  borderRadius: 2,
                  background:
                    selectedZone?.id === z.id ? "#cde8ff" : "transparent",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {Ico.dns} {z.name}
              </div>
            ))}
        </div>
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: 14,
            boxShadow: shadow,
          }}
        >
          {selectedZone && (
            <>
              <div
                style={{
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: T.navy }}>
                    {selectedZone.name}
                  </div>
                  <Badge
                    label={selectedZone.type}
                    bg="#e8f0fe"
                    color="#1a3c8f"
                  />
                </div>
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    {["Name", "Type", "Data"].map((h) => (
                      <th key={h} style={S.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedZone.records.map((r, i) => (
                    <tr
                      key={i}
                      style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                    >
                      <td style={{ ...S.td, fontFamily: "monospace" }}>
                        {r.name}
                      </td>
                      <td style={S.td}>
                        <Badge label={r.type} bg="#f0e8fe" color={T.purple} />
                      </td>
                      <td
                        style={{
                          ...S.td,
                          fontFamily: "monospace",
                          color: "#444",
                          fontSize: 12,
                        }}
                      >
                        {r.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// EVENT VIEWER
// ════════════════════════════════════════════════════════
function EventView({ state }) {
  const [filter, setFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const levels = ["All", "Information", "Warning", "Error"];
  const filtered =
    filter === "All"
      ? state.events
      : state.events.filter((e) => e.level === filter);
  const lStyles = {
    Information: { color: "#2980b9", bg: "#e8f4fb", icon: Ico.info },
    Warning: { color: T.amber, bg: T.amberBg, icon: Ico.warn },
    Error: { color: T.red, bg: T.redBg, icon: Ico.err },
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: selectedEvent ? "1fr 360px" : "1fr",
        gap: 12,
      }}
    >
      <div>
        <ViewHint>
          Select an event to inspect its source, ID, level, and message. In
          production, this is where administrators begin investigating unusual
          behavior.
        </ViewHint>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 700, color: T.navy, fontSize: 15 }}>
            Event Viewer — {DOMAIN}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {levels.map((l) => (
              <button
                key={l}
                onClick={() => setFilter(l)}
                style={{
                  ...S.btnSecondary,
                  background: filter === l ? T.blue2 : "#f0f0f0",
                  color: filter === l ? "#fff" : T.text,
                  fontWeight: filter === l ? 700 : 400,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: shadow,
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr>
                {[
                  "Level",
                  "Date and Time",
                  "Source",
                  "Event ID",
                  "Task Category",
                ].map((h) => (
                  <th key={h} style={S.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev, i) => {
                const ls = lStyles[ev.level] || lStyles.Information;
                return (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    style={{
                      background:
                        selectedEvent?.id === ev.id
                          ? "#cde8ff"
                          : i % 2 === 0
                            ? "#fff"
                            : "#fafafa",
                      cursor: "pointer",
                    }}
                  >
                    <td style={S.td}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          color: ls.color,
                        }}
                      >
                        {ls.icon}
                        <Badge label={ev.level} bg={ls.bg} color={ls.color} />
                      </div>
                    </td>
                    <td
                      style={{
                        ...S.td,
                        fontFamily: "monospace",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ev.time}
                    </td>
                    <td
                      style={{
                        ...S.td,
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ev.source}
                    </td>
                    <td style={{ ...S.td, fontFamily: "monospace" }}>
                      {ev.eventId}
                    </td>
                    <td style={S.td}>{ev.category || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: T.textMut }}>
              No events match the current filter.
            </div>
          )}
        </div>
      </div>

      {/* Event detail pane */}
      {selectedEvent && (
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: 14,
            boxShadow: shadow,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>
              Event Properties
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                color: T.textMut,
              }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {[
              ["Log", selectedEvent.source],
              ["Source", selectedEvent.source],
              ["Event ID", selectedEvent.eventId],
              ["Level", selectedEvent.level],
              ["Date/Time", selectedEvent.time],
              ["Category", selectedEvent.category || "None"],
            ].map(([l, v]) => (
              <div key={l}>
                <span style={{ color: T.textMut }}>{l}:</span>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: T.textSub,
              marginBottom: 6,
            }}
          >
            Description:
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              background: "#f5f5f5",
              border: `1px solid ${T.borderL}`,
              borderRadius: 2,
              padding: 10,
              whiteSpace: "pre-wrap",
              maxHeight: 260,
              overflowY: "auto",
              color: "#222",
            }}
          >
            {selectedEvent.message}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// DC PANEL
// ════════════════════════════════════════════════════════
function DCView({ state }) {
  return (
    <div>
      <div
        style={{
          fontWeight: 700,
          color: T.navy,
          fontSize: 15,
          marginBottom: 12,
        }}
      >
        Domain Controllers — {state.domain}
      </div>
      <ViewHint>
        Domain controllers authenticate users and replicate directory changes.
        FSMO roles coordinate operations that must have a single authority.
      </ViewHint>
      {state.domainControllers.map((dc) => (
        <div
          key={dc.name}
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: 16,
            marginBottom: 14,
            boxShadow: shadow,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: T.navy,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {Ico.dc} {dc.name}.{state.domain}
              </div>
              <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>
                {dc.os}
              </div>
            </div>
            <Badge label={dc.status} bg={T.greenBg} color={T.green} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {[
              ["IP Address", dc.ip],
              ["Site", dc.site],
              ["Uptime", dc.uptime],
            ].map(([l, v]) => (
              <div
                key={l}
                style={{
                  background: "#f5f7fa",
                  borderRadius: 3,
                  padding: "8px 10px",
                }}
              >
                <div style={{ fontSize: 11, color: T.textMut }}>{l}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 12,
              color: T.textSub,
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            FSMO Roles:
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 12,
            }}
          >
            {dc.role.split(", ").map((r) => (
              <Badge key={r} label={r} bg="#e8f0fe" color="#1a3c8f" />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              "Force Replication",
              "Transfer RID Master",
              "View FSMO Roles",
              "Check Replication Health",
              "Run dcdiag",
              "Run repadmin",
            ].map((btn) => (
              <button
                key={btn}
                style={S.btnSecondary}
                onClick={() => alert(`Simulated: ${btn} on ${dc.name}`)}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PrintServicesView() {
  const [printers, setPrinters] = useState([
    {
      id: "prt-01",
      name: "HR-Laser-01",
      location: "HR Office",
      driver: "HP Universal PCL 6",
      status: "Ready",
      jobs: 2,
    },
    {
      id: "prt-02",
      name: "Finance-Color-01",
      location: "Finance Office",
      driver: "Canon UFR II",
      status: "Paused",
      jobs: 0,
    },
    {
      id: "prt-03",
      name: "Reception-MFP",
      location: "Front Desk",
      driver: "Xerox Global Print",
      status: "Ready",
      jobs: 5,
    },
    {
      id: "prt-04",
      name: "IT-Plotter",
      location: "IT Lab",
      driver: "HP DesignJet Driver",
      status: "Offline",
      jobs: 0,
    },
  ]);
  const [selected, setSelected] = useState("prt-01");
  const selectedPrinter =
    printers.find((printer) => printer.id === selected) || printers[0];
  const togglePause = () =>
    setPrinters((items) =>
      items.map((printer) =>
        printer.id === selected
          ? {
              ...printer,
              status: printer.status === "Paused" ? "Ready" : "Paused",
            }
          : printer,
      ),
    );
  const clearJobs = () =>
    setPrinters((items) =>
      items.map((printer) =>
        printer.id === selected ? { ...printer, jobs: 0 } : printer,
      ),
    );
  return (
    <div style={{ padding: 16 }}>
      <PageHeading
        title="Print Services"
        subtitle="Manage shared printers, queues, and print jobs"
      >
        <button
          onClick={() =>
            setPrinters((items) => [
              ...items,
              {
                id: `prt-${Date.now()}`,
                name: "New-Training-Printer",
                location: "Training Room",
                driver: "Microsoft IPP Class Driver",
                status: "Ready",
                jobs: 0,
              },
            ])
          }
          style={S.btnPrimary}
        >
          ＋ Add Printer
        </button>
      </PageHeading>
      <ViewHint>
        Print servers centralize queues and drivers so users can print without
        installing hardware-specific software themselves.
      </ViewHint>
      <div
        className="summary-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {[
          ["Printers", printers.length, T.blue2],
          [
            "Ready",
            printers.filter((printer) => printer.status === "Ready").length,
            T.green,
          ],
          [
            "Paused",
            printers.filter((printer) => printer.status === "Paused").length,
            T.amber,
          ],
          [
            "Queued jobs",
            printers.reduce((total, printer) => total + printer.jobs, 0),
            T.purple,
          ],
        ].map(([label, value, color]) => (
          <div key={label} style={summaryCard}>
            <span style={{ color: T.textSub, fontSize: 12 }}>{label}</span>
            <strong style={{ color, fontSize: 24 }}>{value}</strong>
          </div>
        ))}
      </div>
      <div
        className="server-page-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, .7fr) minmax(0, 1.5fr)",
          gap: 14,
        }}
      >
        <Panel title="Printers">
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {printers.map((printer) => (
              <button
                key={printer.id}
                onClick={() => setSelected(printer.id)}
                style={{
                  textAlign: "left",
                  padding: "9px 10px",
                  border: `1px solid ${selected === printer.id ? T.blue2 : T.borderL}`,
                  background: selected === printer.id ? "#e8f0fe" : "#fff",
                  cursor: "pointer",
                }}
              >
                <strong style={{ display: "block", color: T.navy }}>
                  {printer.name}
                </strong>
                <span style={{ color: T.textSub, fontSize: 11 }}>
                  {printer.location}
                </span>
                <span style={{ display: "block", marginTop: 5 }}>
                  <Badge
                    label={printer.status}
                    bg={
                      printer.status === "Ready"
                        ? T.greenBg
                        : printer.status === "Paused"
                          ? T.amberBg
                          : T.redBg
                    }
                    color={
                      printer.status === "Ready"
                        ? T.green
                        : printer.status === "Paused"
                          ? T.amber
                          : T.red
                    }
                  />
                </span>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title={selectedPrinter.name}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            {[
              ["Location", selectedPrinter.location],
              ["Driver", selectedPrinter.driver],
              ["Queue status", selectedPrinter.status],
              ["Jobs waiting", selectedPrinter.jobs],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={detailLabel}>{label}</div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <button onClick={togglePause} style={S.btnSecondary}>
              {selectedPrinter.status === "Paused"
                ? "Resume queue"
                : "Pause queue"}
            </button>
            <button onClick={clearJobs} style={S.btnSecondary}>
              Clear completed jobs
            </button>
            <button
              onClick={() =>
                alert(
                  `Printer properties for ${selectedPrinter.name} (simulated)`,
                )
              }
              style={S.btnSecondary}
            >
              Properties
            </button>
          </div>
          <div style={{ borderTop: `1px solid ${T.borderL}`, paddingTop: 12 }}>
            <strong style={{ color: T.navy, fontSize: 13 }}>
              Queue activity
            </strong>
            {selectedPrinter.jobs > 0 ? (
              <div style={{ marginTop: 8, color: T.textSub, fontSize: 12 }}>
                {selectedPrinter.jobs} simulated job
                {selectedPrinter.jobs === 1 ? "" : "s"} waiting. A real
                administrator would inspect document owner, size, and submission
                time here.
              </div>
            ) : (
              <div style={{ marginTop: 8, color: T.green, fontSize: 12 }}>
                The queue is clear.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function FileStorageView({ servers }) {
  const fileServer = servers.find((server) => server.type === "File Server") || servers[0];
  const storageKey = "adlapp-file-storage-state";
  const defaultState = {
    shares: [
      { id: "share-public", name: "Public", path: "D:\\Shares\\Public", access: "Domain Users", status: "Online", usage: 38 },
      { id: "share-dept", name: "Departments", path: "D:\\Shares\\Departments", access: "Department groups", status: "Online", usage: 64 },
      { id: "share-home", name: "User Homes", path: "D:\\Shares\\User-Homes", access: "Individual users", status: "Online", usage: 51 },
    ],
    volumes: [
      { id: "vol-os", name: "C:", fileSystem: "NTFS", capacity: "250 GB", free: "91 GB", usage: 64, status: "Healthy" },
      { id: "vol-data", name: "D:", fileSystem: "ReFS", capacity: "3.5 TB", free: "1.9 TB", usage: 46, status: "Healthy" },
      { id: "vol-backup", name: "E:", fileSystem: "NTFS", capacity: "1 TB", free: "280 GB", usage: 72, status: "Review" },
    ],
    quotas: [
      { id: "quota-dept", path: "D:\\Shares\\Departments", limit: "1 TB", used: "640 GB", usage: 64 },
      { id: "quota-home", path: "D:\\Shares\\User-Homes", limit: "500 GB", used: "255 GB", usage: 51 },
    ],
    deduplication: true,
  };
  const [storage, setStorage] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey)) || defaultState;
    } catch (error) {
      return defaultState;
    }
  });
  const [activeTab, setActiveTab] = useState("Overview");
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareName, setShareName] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(storage));
  }, [storage]);

  const announce = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };
  const updateStorage = (next) => setStorage((current) => ({ ...current, ...next }));
  const addShare = () => {
    const name = shareName.trim();
    if (!name) return;
    updateStorage({ shares: [...storage.shares, { id: `share-${Date.now()}`, name, path: `D:\\Shares\\${name}`, access: "Domain Users", status: "Online", usage: 0 }] });
    setShareName("");
    setShowShareForm(false);
    announce(`${name} share created`);
  };
  const toggleShare = (id) => updateStorage({ shares: storage.shares.map((share) => share.id === id ? { ...share, status: share.status === "Online" ? "Offline" : "Online" } : share) });
  const removeShare = (id) => {
    const share = storage.shares.find((item) => item.id === id);
    updateStorage({ shares: storage.shares.filter((item) => item.id !== id) });
    announce(`${share.name} share removed`);
  };
  const usageColor = (usage) => usage >= 80 ? T.red : usage >= 70 ? T.amber : T.green;

  return (
    <div style={pageStyle}>
      <PageHeading title="File and Storage Services" subtitle="Manage shares, volumes, quotas, and storage health">
        <button onClick={() => setShowShareForm(true)} style={S.btnPrimary}>＋ New share</button>
      </PageHeading>
      <ViewHint>
        This workspace models the daily checks an administrator performs on a Windows file server. Changes are saved in this browser so you can practice a complete workflow.
      </ViewHint>
      {notice && <div role="status" style={{ background: T.greenBg, color: T.green, border: "1px solid #b9dfb9", padding: "8px 10px", marginBottom: 12, fontSize: 12 }}>{notice}</div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ color: T.textSub, fontSize: 12 }}><strong style={{ color: T.navy }}>{fileServer.hostname}</strong> · {fileServer.ip} · {fileServer.os}</div>
        <div style={{ display: "flex", gap: 6 }}>{["Overview", "Shares", "Volumes", "Quotas"].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...S.btnSecondary, background: activeTab === tab ? "#dbeeff" : "#f0f0f0", borderColor: activeTab === tab ? "#90c4f0" : T.border }}>{tab}</button>)}</div>
      </div>
      <div className="summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {[["Shared folders", storage.shares.length, T.blue2], ["Healthy volumes", storage.volumes.filter((volume) => volume.status === "Healthy").length, T.green], ["Quota policies", storage.quotas.length, T.purple], ["Storage used", `${Math.round(storage.volumes.reduce((total, volume) => total + volume.usage, 0) / storage.volumes.length)}%`, T.amber]].map(([label, value, color]) => <div key={label} style={summaryCard}><span style={{ color: T.textSub, fontSize: 12 }}>{label}</span><strong style={{ color, fontSize: 24 }}>{value}</strong></div>)}
      </div>
      {activeTab === "Overview" && <div className="server-page-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(260px, .8fr)", gap: 14 }}><Panel title="Storage health">{storage.volumes.map((volume) => <div key={volume.id} style={{ borderBottom: `1px solid ${T.borderL}`, padding: "8px 0" }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><strong>{volume.name} · {volume.fileSystem}</strong><StatusBadge status={volume.status === "Healthy" ? "Online" : "Warning"} /></div><div style={{ display: "flex", justifyContent: "space-between", color: T.textSub, fontSize: 11, marginTop: 5 }}><span>{volume.free} free of {volume.capacity}</span><span>{volume.usage}% used</span></div><div style={{ background: "#e5e7eb", height: 7, marginTop: 5 }}><div style={{ width: `${volume.usage}%`, height: "100%", background: usageColor(volume.usage) }} /></div></div>)}</Panel><Panel title="Server capabilities"><div style={{ color: T.textSub, fontSize: 12, marginBottom: 12 }}>Installed on {fileServer.hostname}</div>{fileServer.services.map((service) => <div key={service} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}><span>{service}</span><StatusBadge status="Online" /></div>)}<button onClick={() => updateStorage({ deduplication: !storage.deduplication })} style={{ ...S.btnSecondary, marginTop: 12 }}>{storage.deduplication ? "Disable" : "Enable"} data deduplication</button></Panel></div>}
      {activeTab === "Shares" && <Panel title="Shared folders"><table style={tableStyle}><thead><tr>{["Share", "Local path", "Access", "Status", "Usage", "Actions"].map((heading) => <th key={heading} style={thStyle}>{heading}</th>)}</tr></thead><tbody>{storage.shares.map((share) => <tr key={share.id}><td style={tdStyle}><strong>{share.name}</strong></td><td style={tdStyle}>{share.path}</td><td style={tdStyle}>{share.access}</td><td style={tdStyle}><StatusBadge status={share.status === "Online" ? "Online" : "Offline"} /></td><td style={tdStyle}>{share.usage}%</td><td style={tdStyle}><button onClick={() => toggleShare(share.id)} style={S.btnSecondary}>{share.status === "Online" ? "Take offline" : "Bring online"}</button> <button onClick={() => removeShare(share.id)} style={S.btnDanger}>Remove</button></td></tr>)}</tbody></table></Panel>}
      {activeTab === "Volumes" && <Panel title="Volumes"><table style={tableStyle}><thead><tr>{["Volume", "File system", "Capacity", "Free space", "Usage", "Status"].map((heading) => <th key={heading} style={thStyle}>{heading}</th>)}</tr></thead><tbody>{storage.volumes.map((volume) => <tr key={volume.id}><td style={tdStyle}><strong>{volume.name}</strong></td><td style={tdStyle}>{volume.fileSystem}</td><td style={tdStyle}>{volume.capacity}</td><td style={tdStyle}>{volume.free}</td><td style={tdStyle}>{volume.usage}%</td><td style={tdStyle}><StatusBadge status={volume.status === "Healthy" ? "Online" : "Warning"} /></td></tr>)}</tbody></table></Panel>}
      {activeTab === "Quotas" && <Panel title="Quota management"><div style={{ color: T.textSub, fontSize: 12, marginBottom: 10 }}>Quota thresholds help prevent one share from consuming the entire data volume.</div><table style={tableStyle}><thead><tr>{["Path", "Limit", "Used", "Usage", "Status"].map((heading) => <th key={heading} style={thStyle}>{heading}</th>)}</tr></thead><tbody>{storage.quotas.map((quota) => <tr key={quota.id}><td style={tdStyle}>{quota.path}</td><td style={tdStyle}>{quota.limit}</td><td style={tdStyle}>{quota.used}</td><td style={tdStyle}>{quota.usage}%</td><td style={tdStyle}><StatusBadge status={quota.usage >= 80 ? "Warning" : "Online"} /></td></tr>)}</tbody></table></Panel>}
      {showShareForm && <div style={modalBackdrop}><div style={{ ...modalPanel, maxWidth: 420 }}><div style={modalHeader}><strong>Create shared folder</strong><button onClick={() => setShowShareForm(false)} style={modalClose}>×</button></div><div style={{ padding: 16 }}><label style={formLabel}>Share name<input autoFocus value={shareName} onChange={(event) => setShareName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addShare()} placeholder="e.g. Projects" style={formInput} /></label><div style={{ color: T.textSub, fontSize: 11, marginTop: 8 }}>The local path will be created under D:\\Shares.</div></div><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "0 16px 16px" }}><button onClick={() => setShowShareForm(false)} style={S.btnSecondary}>Cancel</button><button onClick={addShare} style={S.btnPrimary}>Create share</button></div></div></div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// APP SHELL — Windows Server Manager look
// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
// SERVER MANAGER DASHBOARD  (matches Image 2 exactly)
// ════════════════════════════════════════════════════════
function ServerManagerDashboard({ state, setTool }) {
  const roles = [
    {
      name: "AD DS",
      status: "Online",
      servers: 1,
      events: state.events.filter(
        (e) => e.source.includes("Directory") || e.source.includes("NTDS"),
      ).length,
    },
    {
      name: "DNS",
      status: "Online",
      servers: 1,
      events: state.events.filter((e) => e.source.includes("DNS")).length,
    },
    {
      name: "File and Storage Services",
      status: "Online",
      servers: 1,
      events: 0,
    },
    { name: "Print Services", status: "Online", servers: 1, events: 0 },
  ];
  const totalErrors = state.events.filter((e) => e.level === "Error").length;
  const totalWarnings = state.events.filter(
    (e) => e.level === "Warning",
  ).length;

  return (
    <div style={{ padding: 0 }}>
      {/* Welcome banner */}
      <div
        style={{
          background: "#fff",
          borderBottom: `1px solid ${T.border}`,
          padding: "18px 24px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <img
            src={logo}
            alt="ADlapp logo"
            style={{ width: 72, height: 72, objectFit: "contain" }}
          />
          <div>
            <div style={{ color: T.navy, fontSize: 22, fontWeight: 800 }}>
              ADlapp
            </div>
            <div style={{ color: T.textSub, fontSize: 12 }}>
              Active Directory Learning App
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#444",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 14,
          }}
        >
          WELCOME TO SERVER MANAGER
        </div>
        <div
          className="server-manager-welcome-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: 0,
            minHeight: 180,
          }}
        >
          {/* Orange blocks — Quick Start / What's New / Learn More */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                background: "#e8690a",
                color: "#fff",
                padding: "10px 14px",
                flex: 2,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 20, lineHeight: 1 }}>
                1
              </span>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    opacity: 0.85,
                  }}
                >
                  QUICK START
                </div>
              </div>
            </div>
            <div
              style={{
                background: "#d05c08",
                color: "#fff",
                padding: "8px 14px",
                flex: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  opacity: 0.85,
                }}
              >
                WHAT'S NEW
              </span>
            </div>
            <div
              style={{
                background: "#b84f06",
                color: "#fff",
                padding: "8px 14px",
                flex: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  opacity: 0.85,
                }}
              >
                LEARN MORE
              </span>
            </div>
          </div>
          {/* Quick Start links */}
          <div
            style={{
              padding: "10px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[
              [
                2,
                "Add roles and features",
                () => alert("Add Roles and Features Wizard (simulated)"),
              ],
              [
                3,
                "Add other servers to manage",
                () => alert("Add Servers dialog (simulated)"),
              ],
              [
                4,
                "Create a server group",
                () => alert("Create Server Group (simulated)"),
              ],
              [
                5,
                "Connect this server to cloud services",
                () => alert("Azure Services (simulated)"),
              ],
            ].map(([n, label, action]) => (
              <div
                key={n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14,
                }}
              >
                <span
                  style={{
                    color: "#aaa",
                    fontWeight: 700,
                    fontSize: 16,
                    minWidth: 20,
                  }}
                >
                  {n}
                </span>
                <button
                  onClick={action}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: T.blue2,
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  {label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roles and Server Groups */}
      <div style={{ padding: "16px 24px" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#444",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          ROLES AND SERVER GROUPS
        </div>
        <div style={{ fontSize: 12, color: T.textMut, marginBottom: 12 }}>
          Roles: {roles.length} &nbsp;|&nbsp; Server groups: 1 &nbsp;|&nbsp;
          Servers total: {state.domainControllers.length}
        </div>
        <div
          className="server-manager-roles-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 10,
          }}
        >
          {roles.map((r) => (
            <div
              key={r.name}
              style={{
                background: "#fff",
                border: `1px solid ${T.border}`,
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: shadow,
              }}
            >
              <div
                style={{
                  background: T.sidebar,
                  color: "#fff",
                  padding: "8px 12px",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {r.name}
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: T.textSub }}>Manageability</span>
                  <Badge label="Online" bg={T.greenBg} color={T.green} />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: T.textSub }}>Events</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: r.events > 0 ? T.red : T.green,
                    }}
                  >
                    {r.events}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: T.textSub }}>Servers</span>
                  <span style={{ fontWeight: 700 }}>{r.servers}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event summary */}
      {(totalErrors > 0 || totalWarnings > 0) && (
        <div
          style={{
            margin: "0 24px 16px",
            background: "#fff",
            border: `1px solid ${T.border}`,
            borderRadius: 2,
            padding: 14,
            boxShadow: shadow,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 10,
              color: "#444",
            }}
          >
            Events Summary (Last 24 hours)
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {totalErrors > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {Ico.err}{" "}
                <span style={{ color: T.red, fontWeight: 700 }}>
                  {totalErrors} Error{totalErrors > 1 ? "s" : ""}
                </span>
              </div>
            )}
            {totalWarnings > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {Ico.warn}{" "}
                <span style={{ color: T.amber, fontWeight: 700 }}>
                  {totalWarnings} Warning{totalWarnings > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoTip({ text }) {
  return (
    <span
      title={text}
      style={{ color: T.blue2, cursor: "help", fontWeight: 800 }}
    >
      ⓘ
    </span>
  );
}

function ServerModal({ server, onSave, onClose }) {
  const [draft, setDraft] = useState(
    server || {
      hostname: "APP02",
      ip: "192.168.1.40",
      type: "Application Server",
      os: "Windows Server 2022",
      environment: "Development",
      location: "Accra HQ",
      virtualization: "VM",
      status: "Online",
      owner: "John Addo",
    },
  );
  const update = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <div style={modalBackdrop}>
      <div style={modalPanel}>
        <div style={modalHeader}>
          <strong>{server ? `Edit ${server.hostname}` : "Add Server"}</strong>
          <button onClick={onClose} style={modalClose}>
            ×
          </button>
        </div>
        <div
          className="server-form-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
            padding: 16,
          }}
        >
          {[
            ["hostname", "Hostname"],
            ["ip", "IP address"],
            ["owner", "Assigned administrator"],
          ].map(([key, label]) => (
            <label key={key} style={formLabel}>
              {label}
              <input
                value={draft[key] || ""}
                onChange={(event) => update(key, event.target.value)}
                style={formInput}
              />
            </label>
          ))}
          {[
            [
              "type",
              "Server type",
              [
                "Domain Controller",
                "DNS Server",
                "File Server",
                "Application Server",
                "Web Server",
                "SQL Database",
                "Backup Server",
                "Azure VM",
              ],
            ],
            [
              "os",
              "Operating system",
              [
                "Windows Server 2022",
                "Windows Server 2019",
                "Ubuntu Server 24.04",
                "VMware ESXi 8.0",
              ],
            ],
            [
              "environment",
              "Environment",
              ["Production", "Development", "Testing"],
            ],
            [
              "location",
              "Location",
              ["Accra HQ", "Kumasi DR", "Cloud Lab", "Azure West Europe"],
            ],
            ["virtualization", "Virtualization", ["VM", "Physical"]],
            [
              "status",
              "Status",
              ["Online", "Warning", "Offline", "Maintenance"],
            ],
          ].map(([key, label, options]) => (
            <label key={key} style={formLabel}>
              {label}
              <select
                value={draft[key]}
                onChange={(event) => update(key, event.target.value)}
                style={formInput}
              >
                {options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "0 16px 16px",
          }}
        >
          <button onClick={onClose} style={S.btnSecondary}>
            Cancel
          </button>
          <button onClick={() => onSave(draft)} style={S.btnPrimary}>
            Save server
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    Online: [T.green, T.greenBg],
    Warning: [T.amber, T.amberBg],
    Offline: [T.red, T.redBg],
    Maintenance: [T.blue2, "#e8f0fe"],
  };
  const [color, bg] = colors[status] || [T.textSub, "#eee"];
  return (
    <span
      style={{
        background: bg,
        color,
        padding: "3px 7px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <span style={{ marginRight: 4 }}>●</span>
      {status}
    </span>
  );
}

function LocalServerView({ servers, updateServers }) {
  const server = servers.find((item) => item.isLocal) || servers[0];
  const [settings, setSettings] = useState(() => {
    try {
      return (
        JSON.parse(
          window.localStorage.getItem("adlapp-local-server-settings"),
        ) || {
          firewall: "On",
          remoteManagement: "Enabled",
          remoteDesktop: "Disabled",
          ieSecurity: "On",
          windowsUpdate: "Up to date",
        }
      );
    } catch (error) {
      return {
        firewall: "On",
        remoteManagement: "Enabled",
        remoteDesktop: "Disabled",
        ieSecurity: "On",
        windowsUpdate: "Up to date",
      };
    }
  });
  const [editing, setEditing] = useState(null);
  const [eventFilter, setEventFilter] = useState("All");
  useEffect(() => {
    window.localStorage.setItem(
      "adlapp-local-server-settings",
      JSON.stringify(settings),
    );
  }, [settings]);
  const propertyRows = [
    ["Computer name", server.hostname],
    ["Domain", DOMAIN],
    ["Windows Firewall", settings.firewall],
    ["Remote management", settings.remoteManagement],
    ["Remote Desktop", settings.remoteDesktop],
    ["NIC Teaming", "Disabled"],
    ["Ethernet / IP address", `Ethernet · ${server.ip}`],
    ["Operating system", server.os],
    ["Hardware", `${server.virtualization} · ${server.cpu} · ${server.ram}`],
    ["Last installed update", "2026-09-12"],
    ["Windows Update", settings.windowsUpdate],
    ["Last checked for updates", "Today 08:30"],
    ["IE Enhanced Security Configuration", settings.ieSecurity],
    ["Time zone", "UTC+00:00 Accra"],
    ["Product ID", "00329-80000-00000-AAOEM"],
  ];
  const toggleValue = (label) => {
    const key =
      label === "Windows Firewall"
        ? "firewall"
        : label === "Remote management"
          ? "remoteManagement"
          : label === "Remote Desktop"
            ? "remoteDesktop"
            : label === "IE Enhanced Security Configuration"
              ? "ieSecurity"
              : "windowsUpdate";
    const values =
      key === "windowsUpdate"
        ? ["Up to date", "Updates available"]
        : key === "remoteDesktop"
          ? ["Disabled", "Enabled"]
          : ["On", "Off"];
    setSettings((current) => ({
      ...current,
      [key]: values[(values.indexOf(current[key]) + 1) % values.length],
    }));
    setEditing(null);
  };
  const events = (server.events || []).filter(
    (event) => eventFilter === "All" || event.severity === eventFilter,
  );
  return (
    <div style={pageStyle}>
      <PageHeading
        title="Local Server"
        subtitle="Properties and status of this server"
      />
      <div
        className="server-page-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.45fr) minmax(260px, .8fr)",
          gap: 14,
        }}
      >
        <Panel title={`${server.hostname} properties`}>
          <div
            className="property-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            }}
          >
            {propertyRows.map(([label, value]) => (
              <button
                key={label}
                onClick={() => setEditing(label)}
                style={propertyButton}
              >
                <span>
                  {label}
                  {[
                    "NIC Teaming",
                    "Remote management",
                    "IE Enhanced Security Configuration",
                  ].includes(label) && (
                    <InfoTip
                      text={
                        label === "NIC Teaming"
                          ? "Combines network adapters for resilience and bandwidth."
                          : label === "Remote management"
                            ? "Lets administrators manage this server from another computer."
                            : "Hardens Internet Explorer settings on a server to reduce browsing risk."
                      }
                    />
                  )}
                </span>
                <strong
                  style={{
                    color: ["On", "Enabled", "Up to date"].includes(value)
                      ? T.green
                      : value === "Off" ||
                          value === "Disabled" ||
                          value === "Updates available"
                        ? T.amber
                        : T.text,
                  }}
                >
                  {value}
                </strong>
              </button>
            ))}
          </div>
        </Panel>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Panel title="Performance">
            <Metric label="CPU utilization" value={42} color={T.blue2} />
            <Metric label="Memory utilization" value={68} color={T.orange} />
            <Metric label="Storage utilization" value={54} color={T.green} />
          </Panel>
          <Panel title="Roles and Features">
            <ul style={listStyle}>
              {server.services.map((service) => (
                <li key={service}>
                  <span>{service}</span>
                  <StatusBadge status="Online" />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
      <div
        className="server-page-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(260px, .8fr)",
          gap: 14,
          marginTop: 14,
        }}
      >
        <Panel title="Recent system events">
          <select
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
            style={{ ...formInput, width: "auto", marginBottom: 8 }}
          >
            <option>All</option>
            <option>Info</option>
            <option>Warning</option>
            <option>Error</option>
          </select>
          <EventTable events={events} />
        </Panel>
        <Panel title="Best Practices Analyzer">
          <div style={{ color: T.amber, fontSize: 24, fontWeight: 800 }}>
            3 issues found
          </div>
          {[
            "Configure automatic updates",
            "Review administrator membership",
            "Enable backup verification",
          ].map((issue) => (
            <div
              key={issue}
              style={{
                padding: "10px 0",
                borderBottom: `1px solid ${T.borderL}`,
                fontSize: 12,
              }}
            >
              {issue}{" "}
              <InfoTip text="This simulated recommendation helps reduce operational risk and improve recoverability." />
            </div>
          ))}
        </Panel>
      </div>
      {editing && (
        <div style={modalBackdrop}>
          <div style={{ ...modalPanel, maxWidth: 360 }}>
            <div style={modalHeader}>
              <strong>{editing}</strong>
              <button onClick={() => setEditing(null)} style={modalClose}>
                ×
              </button>
            </div>
            <p style={{ padding: "0 16px", color: T.textSub, fontSize: 13 }}>
              This is a simulated setting for {server.hostname}. Changes affect
              this learning session only.
            </p>
            <button
              onClick={() => toggleValue(editing)}
              style={{ ...S.btnPrimary, margin: "0 16px 16px" }}
            >
              Toggle value
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AllServersView({ servers, updateServers, openDetails }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "All",
    type: "All",
    os: "All",
    environment: "All",
    location: "All",
    virtualization: "All",
  });
  const [modal, setModal] = useState(null);
  const options = (key) => [
    "All",
    ...new Set(servers.map((server) => server[key])),
  ];
  const filtered = servers.filter(
    (server) =>
      [server.hostname, server.ip, server.owner].some((value) =>
        value.toLowerCase().includes(query.toLowerCase()),
      ) &&
      Object.entries(filters).every(
        ([key, value]) => value === "All" || server[key] === value,
      ),
  );
  const save = (draft) => {
    const next = {
      ...draft,
      id: draft.id || `server-${Date.now()}`,
      events: draft.events || [
        { time: "Just now", event: "Server record created", severity: "Info" },
      ],
      services: draft.services || ["Server Management"],
      cpu: draft.cpu || "4 vCPU",
      ram: draft.ram || "16 GB",
      storage: draft.storage || "250 GB",
      uptime: draft.uptime || "0 days",
      health: draft.health || "Healthy",
      backup: draft.backup || "Not configured",
    };
    updateServers(
      draft.id
        ? servers.map((server) => (server.id === draft.id ? next : server))
        : [...servers, next],
    );
    setModal(null);
  };
  return (
    <div style={pageStyle}>
      <PageHeading
        title="All Servers"
        subtitle="View and manage all servers across your infrastructure"
      >
        <button onClick={() => setModal({})} style={S.btnPrimary}>
          ＋ Add Server
        </button>
      </PageHeading>
      <div
        className="summary-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {[
          ["Total Servers", servers.length, T.blue2],
          [
            "Online",
            servers.filter((s) => s.status === "Online").length,
            T.green,
          ],
          [
            "Warning",
            servers.filter((s) => s.status === "Warning").length,
            T.amber,
          ],
          [
            "Offline",
            servers.filter((s) => s.status === "Offline").length,
            T.red,
          ],
        ].map(([label, value, color]) => (
          <div key={label} style={summaryCard}>
            <div style={{ color: T.textSub, fontSize: 12 }}>{label}</div>
            <strong style={{ color, fontSize: 25 }}>{value}</strong>
          </div>
        ))}
      </div>
      <Panel>
        <input
          aria-label="Search servers"
          placeholder="Search hostname, IP address, or owner"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{
            ...formInput,
            width: "100%",
            boxSizing: "border-box",
            marginBottom: 10,
          }}
        />
        <div
          className="filter-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(100px, 1fr))",
            gap: 7,
            marginBottom: 12,
          }}
        >
          {Object.entries(filters).map(([key, value]) => (
            <select
              key={key}
              aria-label={key}
              value={value}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              style={formInput}
            >
              {options(key).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {[
                  "Server",
                  "IP Address",
                  "Type",
                  "OS",
                  "Environment",
                  "Location",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} style={thStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((server) => (
                <tr
                  key={server.id}
                  onClick={() => openDetails(server.id)}
                  style={{ cursor: "pointer" }}
                >
                  {[
                    server.hostname,
                    server.ip,
                    server.type,
                    server.os,
                    server.environment,
                    server.location,
                  ].map((value) => (
                    <td key={value} style={tdStyle}>
                      {value}
                    </td>
                  ))}
                  <td style={tdStyle}>
                    <StatusBadge status={server.status} />
                  </td>
                  <td
                    style={tdStyle}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <select
                      aria-label={`Actions for ${server.hostname}`}
                      value=""
                      onChange={(event) => {
                        if (event.target.value === "View")
                          openDetails(server.id);
                        if (event.target.value === "Edit") setModal(server);
                        if (event.target.value === "Delete")
                          updateServers(
                            servers.filter((item) => item.id !== server.id),
                          );
                      }}
                      style={{ ...formInput, width: 86 }}
                    >
                      <option value="">⋮</option>
                      <option>View</option>
                      <option>Edit</option>
                      <option>Delete</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: T.textSub }}>
              No servers match the current search and filters.
            </div>
          )}
        </div>
      </Panel>
      {modal && (
        <ServerModal
          server={modal.id ? modal : null}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function ServerDetailsView({ server, goBack }) {
  return (
    <div style={pageStyle}>
      <PageHeading
        title={`${server.hostname} details`}
        subtitle="Simulated health and configuration record"
      >
        <button onClick={goBack} style={S.btnSecondary}>
          ← All Servers
        </button>
      </PageHeading>
      <Panel title="Server identity">
        <div
          className="detail-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {[
            ["Hostname", server.hostname],
            ["IP address", server.ip],
            ["MAC address", server.mac],
            ["OS", server.os],
            ["Server type", server.type],
            ["CPU", server.cpu],
            ["RAM", server.ram],
            ["Storage", server.storage],
            ["Uptime", server.uptime],
            ["Environment", server.environment],
            ["Location", server.location],
            ["Assigned administrator", server.owner],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={detailLabel}>
                {label}
                {["MAC address", "Uptime"].includes(label) && (
                  <InfoTip
                    text={
                      label === "MAC address"
                        ? "A network interface identifier used to distinguish hardware on a local network."
                        : "How long the server has been running since its last restart."
                    }
                  />
                )}
              </div>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </Panel>
      <div
        className="server-page-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 14,
          marginTop: 14,
        }}
      >
        <Panel title="Health and services">
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <StatusBadge status={server.status} />
            <span style={{ color: T.green, fontWeight: 700 }}>
              {server.health}
            </span>
          </div>
          <div style={detailLabel}>Installed services</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {server.services.map((service) => (
              <Badge
                key={service}
                label={service}
                bg="#e8f0fe"
                color={T.blue2}
              />
            ))}
          </div>
          <div style={{ ...detailLabel, marginTop: 16 }}>
            Backup status{" "}
            <InfoTip text="Backups provide a recovery path after hardware failure, mistakes, or security incidents." />
          </div>
          <strong>{server.backup}</strong>
        </Panel>
        <Panel title="Recent events and logs">
          <EventTable events={server.events || []} />
        </Panel>
      </div>
    </div>
  );
}

function PageHeading({ title, subtitle, children }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 14,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1 style={{ margin: 0, color: T.navy, fontSize: 23 }}>{title}</h1>
        <div style={{ color: T.textSub, marginTop: 4, fontSize: 13 }}>
          {subtitle}
        </div>
      </div>
      {children}
    </div>
  );
}
function Panel({ title, children }) {
  return (
    <section
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: shadow,
        padding: 14,
      }}
    >
      <h2 style={{ margin: "0 0 12px", color: T.navy, fontSize: 15 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
function Metric({ label, value, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
        }}
      >
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div style={{ background: "#e5e7eb", height: 8, marginTop: 5 }}>
        <div
          style={{ width: `${value}%`, height: "100%", background: color }}
        />
      </div>
    </div>
  );
}
function EventTable({ events }) {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {["Timestamp", "Event", "Severity"].map((heading) => (
            <th key={heading} style={thStyle}>
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {events.map((event, index) => (
          <tr key={`${event.time}-${index}`}>
            <td style={tdStyle}>{event.time}</td>
            <td style={tdStyle}>{event.event}</td>
            <td style={tdStyle}>
              <StatusBadge
                status={event.severity === "Info" ? "Online" : event.severity}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const pageStyle = { padding: 18, maxWidth: 1500, margin: "0 auto" };
const topMenuStyle = {
  position: "absolute",
  top: "100%",
  right: 0,
  background: "#f5f5f5",
  border: `1px solid ${T.border}`,
  boxShadow: "2px 4px 14px rgba(0,0,0,0.22)",
  zIndex: 9999,
  padding: "4px 0",
};
const topMenuTitle = {
  padding: "5px 14px 7px",
  color: T.textSub,
  borderBottom: `1px solid ${T.borderL}`,
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.6,
};
const topMenuItem = {
  width: "100%",
  border: 0,
  background: "transparent",
  color: T.text,
  padding: "8px 14px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  textAlign: "left",
  cursor: "pointer",
  fontSize: 12,
};
const modalBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: 16,
};
const modalPanel = {
  background: T.surface,
  width: "100%",
  maxWidth: 650,
  boxShadow: "0 12px 40px rgba(0,0,0,.35)",
};
const modalHeader = {
  padding: "12px 16px",
  background: T.sidebar,
  color: "#fff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const modalClose = {
  background: "none",
  border: 0,
  color: "#fff",
  fontSize: 22,
  cursor: "pointer",
};
const formLabel = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: T.textSub,
  fontSize: 11,
  fontWeight: 700,
};
const formInput = {
  border: `1px solid ${T.border}`,
  padding: "7px 8px",
  background: "#fff",
  color: T.text,
  fontSize: 12,
  minWidth: 0,
};
const propertyButton = {
  border: `1px solid ${T.borderL}`,
  background: "#fafbfc",
  padding: "9px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 5,
  alignItems: "flex-start",
  textAlign: "left",
  cursor: "pointer",
  color: T.textSub,
  fontSize: 11,
};
const summaryCard = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 12 };
const thStyle = {
  background: T.sidebar,
  color: "#fff",
  textAlign: "left",
  padding: "8px 7px",
  whiteSpace: "nowrap",
};
const tdStyle = {
  borderBottom: `1px solid ${T.borderL}`,
  padding: "8px 7px",
  whiteSpace: "nowrap",
};
const detailLabel = { color: T.textSub, fontSize: 11, marginBottom: 4 };
const listStyle = { listStyle: "none", padding: 0, margin: 0, fontSize: 12 };

// ════════════════════════════════════════════════════════
// TOOLS DROPDOWN (matches Image 2 Tools menu exactly)
// ════════════════════════════════════════════════════════
function ServerManagerMenu({ menu, setTool, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  const menuItems = {
    Manage: [
      [
        "Add other servers to manage",
        "Open the shared server inventory",
        "allsrv",
      ],
      [
        "Local Server properties",
        "Review this machine's configuration",
        "local",
      ],
      ["Print Services", "Manage queues and printer drivers", "print"],
      ["Server Manager dashboard", "Return to the overview", "servermgr"],
    ],
    View: [
      ["Dashboard", "Roles, events, and quick-start actions", "servermgr"],
      ["Local Server", "Properties and performance", "local"],
      ["All Servers", "Inventory, filters, and server health", "allsrv"],
      ["Event Viewer", "Inspect warnings and errors", "events"],
    ],
    Help: [
      [
        "AD DS learning workspace",
        "Browse users, computers, and directory objects",
        "aduc",
      ],
      [
        "Event Viewer investigation guide",
        "Practice tracing a source and event ID",
        "events",
      ],
      ["Domain controller concepts", "Review replication and FSMO roles", "dc"],
      ["About ADlapp", "Simulated training environment", null],
    ],
  }[menu];

  return (
    <div ref={ref} style={{ ...topMenuStyle, minWidth: 280 }}>
      <div style={topMenuTitle}>{menu}</div>
      {menuItems.map(([label, description, destination]) => (
        <button
          key={label}
          onClick={() => {
            if (destination) setTool(destination);
            onClose();
          }}
          style={topMenuItem}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "#dde8f4";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "transparent";
          }}
        >
          <strong>{label}</strong>
          <span>{description}</span>
        </button>
      ))}
    </div>
  );
}

function ToolsDropdown({ setTool, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const menuItems = [
    {
      label: "Active Directory Administrative Center",
      action: () => alert("AD Admin Center (simulated)"),
    },
    {
      label: "Active Directory Domains and Trusts",
      action: () => alert("AD Domains and Trusts (simulated)"),
    },
    {
      label: "Active Directory Module for Windows PowerShell",
      action: () => alert("PowerShell AD Module (simulated)"),
    },
    {
      label: "Active Directory Sites and Services",
      action: () => alert("AD Sites and Services (simulated)"),
    },
    {
      label: "Active Directory Users and Computers",
      action: () => {
        setTool("aduc");
        onClose();
      },
      highlight: true,
    },
    { label: "ADSI Edit", action: () => alert("ADSI Edit (simulated)") },
    "---",
    {
      label: "Component Services",
      action: () => alert("Component Services (simulated)"),
    },
    {
      label: "Computer Management",
      action: () => alert("Computer Management (simulated)"),
    },
    {
      label: "Defragment and Optimize Drives",
      action: () => alert("Defrag (simulated)"),
    },
    { label: "Disk Cleanup", action: () => alert("Disk Cleanup (simulated)") },
    "---",
    {
      label: "DNS",
      action: () => {
        setTool("dns");
        onClose();
      },
    },
    {
      label: "Event Viewer",
      action: () => {
        setTool("events");
        onClose();
      },
    },
    {
      label: "File Server Resource Manager",
      action: () => alert("FSRM (simulated)"),
    },
    {
      label: "Group Policy Management",
      action: () => {
        setTool("gpo");
        onClose();
      },
    },
    {
      label: "iSCSI Initiator",
      action: () => alert("iSCSI Initiator (simulated)"),
    },
    {
      label: "Local Security Policy",
      action: () => alert("Local Security Policy (simulated)"),
    },
    {
      label: "Microsoft Azure Services",
      action: () => alert("Azure Services (simulated)"),
    },
    {
      label: "ODBC Data Sources (32-bit)",
      action: () => alert("ODBC 32-bit (simulated)"),
    },
    {
      label: "ODBC Data Sources (64-bit)",
      action: () => alert("ODBC 64-bit (simulated)"),
    },
    {
      label: "Performance Monitor",
      action: () => alert("Performance Monitor (simulated)"),
    },
    {
      label: "Print Management",
      action: () => alert("Print Management (simulated)"),
    },
    {
      label: "Remote Desktop Services",
      action: () => alert("RDS (simulated)"),
    },
    {
      label: "Resource Monitor",
      action: () => alert("Resource Monitor (simulated)"),
    },
    {
      label: "Security Configuration Wizard",
      action: () => alert("SCW (simulated)"),
    },
    { label: "Services", action: () => alert("Services (simulated)") },
    {
      label: "System Configuration",
      action: () => alert("msconfig (simulated)"),
    },
    {
      label: "System Information",
      action: () => alert("System Information (simulated)"),
    },
    {
      label: "Task Scheduler",
      action: () => alert("Task Scheduler (simulated)"),
    },
    {
      label: "Windows Memory Diagnostic",
      action: () => alert("Memory Diagnostic (simulated)"),
    },
    {
      label: "Windows PowerShell",
      action: () => alert("PowerShell (simulated)"),
    },
    {
      label: "Windows PowerShell (x86)",
      action: () => alert("PowerShell x86 (simulated)"),
    },
    {
      label: "Windows PowerShell ISE",
      action: () => alert("PowerShell ISE (simulated)"),
    },
    {
      label: "Windows Server Backup",
      action: () => alert("Windows Server Backup (simulated)"),
    },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        background: "#f5f5f5",
        border: `1px solid ${T.border}`,
        boxShadow: "2px 4px 14px rgba(0,0,0,0.22)",
        zIndex: 9999,
        minWidth: 320,
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      {menuItems.map((item, i) =>
        item === "---" ? (
          <div
            key={i}
            style={{ height: 1, background: "#ddd", margin: "3px 0" }}
          />
        ) : (
          <div
            key={i}
            onClick={item.action}
            style={{
              padding: "5px 14px",
              fontSize: 13,
              cursor: "pointer",
              background: item.highlight ? "#cde8ff" : "transparent",
              color: item.highlight ? T.navy : T.text,
              fontWeight: item.highlight ? 700 : 400,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = item.highlight
                ? "#b8d8f8"
                : "#dde8f4")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = item.highlight
                ? "#cde8ff"
                : "transparent")
            }
          >
            {item.label}
          </div>
        ),
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════
export default function App() {
  const [state, dispatch] = useReducer(adReducer, initialState);
  const [tool, setTool] = useState("servermgr");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [topMenu, setTopMenu] = useState(null);
  const [servers, setServers] = useState(loadServers);
  const [selectedServerId, setSelectedServerId] = useState(null);

  const updateServers = useCallback((nextServers) => {
    setServers(nextServers);
    saveServers(nextServers);
  }, []);

  const logEvent = useCallback(
    (message, level = "Information", source = "AD Manager", eventId = 5000) => {
      dispatch({
        type: "ADD_EVENT",
        payload: {
          id: newId("e"),
          time: now(),
          level,
          source,
          eventId,
          category: "Admin",
          message,
        },
      });
    },
    [],
  );

  // Left nav items — matches Image 2 exactly
  const navItems = [
    { id: "servermgr", label: "Dashboard", icon: "⊞", bold: true },
    {
      id: "local",
      label: "Local Server",
      icon: "🖥",
    },
    {
      id: "allsrv",
      label: "All Servers",
      icon: "🖧",
    },
    { id: "aduc", label: "AD DS", icon: "🏢" },
    { id: "dns", label: "DNS", icon: "🌐" },
    { id: "gpo", label: "Group Policy Management", icon: "🛡" },
    {
      id: "files",
      label: "File and Storage Services",
      icon: "📂",
      arrow: true,
    },
    {
      id: "print",
      label: "Print Services",
      icon: "🖨",
    },
  ];

  const errors = state.events.filter((e) => e.level === "Error").length;
  const warnings = state.events.filter((e) => e.level === "Warning").length;

  const activeLabel = (() => {
    if (tool === "servermgr") return "Dashboard";
    if (tool === "aduc") return "AD DS";
    if (tool === "events") return "Event Viewer";
    if (tool === "dc") return "Domain Controllers";
    if (tool === "print") return "Print Services";
    if (tool === "details") return "Server Details";
    return navItems.find((n) => n.id === tool)?.label || tool;
  })();

  return (
    <div
      style={{
        fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
        background: "#2d2d2d",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top bar  (matches Image 2 exactly) ── */}
      <div
        className="server-manager-topbar"
        style={{
          background: "#1e1e1e",
          height: 42,
          display: "flex",
          alignItems: "center",
          padding: "0 0 0 0",
          gap: 0,
          flexShrink: 0,
          borderBottom: "1px solid #111",
        }}
      >
        {/* Back/Forward/Refresh */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            padding: "0 10px",
            borderRight: "1px solid #3a3a3a",
            height: "100%",
          }}
        >
          {["◀", "▶"].map((a, i) => (
            <button
              key={i}
              style={{
                background: "none",
                border: "none",
                color: "#aaa",
                cursor: "pointer",
                fontSize: 14,
                padding: "0 6px",
                height: "100%",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {a}
            </button>
          ))}
        </div>
        {/* Breadcrumb */}
        <div
          className="server-manager-breadcrumb"
          style={{
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
          }}
        >
          <img
            src={logo}
            alt="ADlapp logo"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
            ADlapp
          </span>
          <span style={{ color: "#666", fontSize: 14 }}>▶</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
            Server Manager
          </span>
          <span style={{ color: "#666", fontSize: 14 }}>▶</span>
          <span style={{ color: "#ccc", fontSize: 14 }}>{activeLabel}</span>
        </div>
        {/* Refresh icon */}
        <div
          style={{
            padding: "0 10px",
            borderLeft: "1px solid #3a3a3a",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <button
            style={{
              background: "none",
              border: "none",
              color: "#aaa",
              cursor: "pointer",
              fontSize: 16,
            }}
            onClick={() => {}}
          >
            ↻
          </button>
        </div>
        {/* Flag / alerts */}
        <div
          style={{
            padding: "0 12px",
            borderLeft: "1px solid #3a3a3a",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {errors + warnings > 0 ? (
            <span
              style={{ color: "#e8690a", fontSize: 18, cursor: "pointer" }}
              title={`${errors} errors, ${warnings} warnings`}
            >
              ⚑
            </span>
          ) : (
            <span style={{ color: "#555", fontSize: 18 }}>⚑</span>
          )}
        </div>
        {/* Manage / Tools / View / Help */}
        <div style={{ display: "flex", height: "100%", position: "relative" }}>
          {["Manage", "View", "Help"].map((m) => (
            <div key={m} style={{ position: "relative", height: "100%" }}>
              <button
                onClick={() => {
                  setTopMenu((current) => (current === m ? null : m));
                  setToolsOpen(false);
                }}
                style={{
                  background: topMenu === m ? "#333" : "none",
                  border: "none",
                  borderLeft: "1px solid #3a3a3a",
                  color: "#ccc",
                  cursor: "pointer",
                  padding: "0 14px",
                  fontSize: 13,
                  height: "100%",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#333")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    topMenu === m ? "#333" : "none")
                }
              >
                {m} <span style={{ color: "#777", fontSize: 10 }}>▼</span>
              </button>
              {topMenu === m && (
                <ServerManagerMenu
                  menu={m}
                  setTool={setTool}
                  onClose={() => setTopMenu(null)}
                />
              )}
            </div>
          ))}
          {/* Tools — highlighted in orange like Image 2 */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setToolsOpen((o) => !o)}
              style={{
                background: toolsOpen ? "#e8690a" : "#e8690a",
                border: "none",
                borderLeft: "1px solid #3a3a3a",
                color: "#fff",
                cursor: "pointer",
                padding: "0 16px",
                fontSize: 13,
                height: "100%",
                fontWeight: 700,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#d05c08")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#e8690a")
              }
            >
              Tools
            </button>
            {toolsOpen && (
              <ToolsDropdown
                setTool={(t) => {
                  setTool(t);
                  setToolsOpen(false);
                }}
                onClose={() => setToolsOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div
        className="server-manager-body"
        style={{ display: "flex", flex: 1, overflow: "hidden" }}
      >
        {/* ── Left sidebar (matches Image 2 dark nav) ── */}
        <div
          className="server-manager-sidebar"
          style={{
            width: 200,
            background: "#2d2d2d",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflowY: "auto",
            borderRight: "1px solid #111",
          }}
        >
          {navItems.map((nav) => {
            const isActive = tool === nav.id;
            const click = nav.action || (() => setTool(nav.id));
            return (
              <div
                key={nav.id}
                onClick={click}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: isActive ? "#0078d4" : "transparent",
                  color: isActive ? "#fff" : "#bbb",
                  borderLeft: isActive
                    ? "3px solid #5bb8ff"
                    : "3px solid transparent",
                  fontSize: 13,
                  fontWeight: nav.bold ? 700 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#3a3a3a";
                    e.currentTarget.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#bbb";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{nav.icon}</span>
                  <span>{nav.label}</span>
                </div>
                {nav.arrow && (
                  <span style={{ fontSize: 10, opacity: 0.5 }}>▶</span>
                )}
              </div>
            );
          })}
          {/* Separator + extra tools */}
          <div style={{ height: 1, background: "#3a3a3a", margin: "6px 0" }} />
          <div
            onClick={() => setTool("dc")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 14px",
              cursor: "pointer",
              background: tool === "dc" ? "#0078d4" : "transparent",
              color: tool === "dc" ? "#fff" : "#bbb",
              fontSize: 13,
            }}
            onMouseEnter={(e) => {
              if (tool !== "dc") {
                e.currentTarget.style.background = "#3a3a3a";
                e.currentTarget.style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (tool !== "dc") {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#bbb";
              }
            }}
          >
            <span style={{ fontSize: 14 }}>{Ico.dc}</span>
            <span>Domain Controllers</span>
          </div>
          <div
            onClick={() => setTool("events")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 14px",
              cursor: "pointer",
              background: tool === "events" ? "#0078d4" : "transparent",
              color: tool === "events" ? "#fff" : "#bbb",
              fontSize: 13,
            }}
            onMouseEnter={(e) => {
              if (tool !== "events") {
                e.currentTarget.style.background = "#3a3a3a";
                e.currentTarget.style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (tool !== "events") {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#bbb";
              }
            }}
          >
            <span style={{ fontSize: 14 }}>{Ico.event}</span>
            <span>Event Viewer</span>
          </div>
          {/* Bottom info */}
          <div
            style={{
              marginTop: "auto",
              padding: "10px 14px",
              borderTop: "1px solid #3a3a3a",
            }}
          >
            <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>
              DOMAIN
            </div>
            <div style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
              {state.domain}
            </div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 5 }}>
              USERS / COMPUTERS
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {state.users.length} / {state.computers.length}
            </div>
          </div>
        </div>

        {/* ── Main content area ── */}
        <div
          className="server-manager-main"
          style={{
            flex: 1,
            overflow: "auto",
            background: [
              "servermgr",
              "local",
              "allsrv",
              "details",
              "files",
              "print",
            ].includes(tool)
              ? "#efefef"
              : T.bg,
          }}
        >
          {tool === "servermgr" && (
            <ServerManagerDashboard state={state} setTool={setTool} />
          )}
          {tool === "local" && (
            <LocalServerView servers={servers} updateServers={updateServers} />
          )}
          {tool === "allsrv" && (
            <AllServersView
              servers={servers}
              updateServers={updateServers}
              openDetails={(id) => {
                setSelectedServerId(id);
                setTool("details");
              }}
            />
          )}
          {tool === "details" &&
            servers.find((server) => server.id === selectedServerId) && (
              <ServerDetailsView
                server={servers.find(
                  (server) => server.id === selectedServerId,
                )}
                goBack={() => setTool("allsrv")}
              />
            )}
          {tool === "print" && <PrintServicesView />}
          {tool === "files" && <FileStorageView servers={servers} />}
          {tool === "aduc" && (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ADUCView state={state} dispatch={dispatch} logEvent={logEvent} />
            </div>
          )}
          {tool === "gpo" && (
            <div style={{ padding: 16 }}>
              <GPOView state={state} dispatch={dispatch} logEvent={logEvent} />
            </div>
          )}
          {tool === "dns" && (
            <div style={{ padding: 16 }}>
              <DNSView state={state} />
            </div>
          )}
          {tool === "dc" && (
            <div style={{ padding: 16 }}>
              <DCView state={state} />
            </div>
          )}
          {tool === "events" && (
            <div style={{ padding: 16 }}>
              <EventView state={state} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

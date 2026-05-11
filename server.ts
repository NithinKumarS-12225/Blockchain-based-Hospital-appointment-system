import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";

// --- Blockchain Core Logic ---

enum AppointmentStatus {
  BOOKED = "BOOKED",
  CANCELLED = "CANCELLED",
}

interface AppointmentData {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  dateTime: string;
  status: AppointmentStatus;
}

class Block {
  public timestamp: number;
  public hash: string;

  constructor(
    public index: number,
    public prevHash: string,
    public data: AppointmentData
  ) {
    this.timestamp = Date.now();
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    const str = this.index + this.prevHash + this.timestamp + JSON.stringify(this.data);
    return crypto.createHash("sha256").update(str).digest("hex");
  }
}

class Blockchain {
  public chain: Block[];
  public doctors: Record<string, string[]> = {
    "Dr. Smith": ["09:00", "10:00", "11:00", "14:00", "15:00"],
    "Dr. Jones": ["09:30", "10:30", "11:30", "14:30", "15:30"],
    "Dr. Taylor": ["08:00", "12:00", "16:00"],
  };
  public bookings: Map<string, string> = new Map(); // appointmentId -> patientName (for validation)

  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  private createGenesisBlock(): Block {
    return new Block(0, "0", {
      appointmentId: "GENESIS",
      patientName: "System",
      doctorName: "None",
      dateTime: "N/A",
      status: AppointmentStatus.BOOKED,
    });
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data: AppointmentData): Block {
    const prevBlock = this.getLatestBlock();
    const newBlock = new Block(this.chain.length, prevBlock.hash, data);
    this.chain.push(newBlock);

    // Update availability logic
    if (data.status === AppointmentStatus.BOOKED) {
      this.bookings.set(data.appointmentId, data.patientName);
      // Remove slot
      this.doctors[data.doctorName] = this.doctors[data.doctorName].filter(
        (t) => t !== data.dateTime
      );
    } else if (data.status === AppointmentStatus.CANCELLED) {
      // Return slot
      if (!this.doctors[data.doctorName].includes(data.dateTime)) {
        this.doctors[data.doctorName].push(data.dateTime);
        this.doctors[data.doctorName].sort();
      }
    }

    return newBlock;
  }
}

const hospitalChain = new Blockchain();

// --- Server Setup ---

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/chain", (req, res) => {
    res.json(hospitalChain.chain);
  });

  app.get("/api/doctors", (req, res) => {
    res.json(hospitalChain.doctors);
  });

  app.post("/api/book", (req, res) => {
    const { patientName, doctorName, dateTime } = req.body;
    if (!patientName || !doctorName || !dateTime) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const appointmentId = `APT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const block = hospitalChain.addBlock({
      appointmentId,
      patientName,
      doctorName,
      dateTime,
      status: AppointmentStatus.BOOKED,
    });

    res.json({ success: true, block });
  });

  app.post("/api/cancel", (req, res) => {
    const { appointmentId, patientName } = req.body;

    // Validate that only the original booker can cancel
    const originalPatient = hospitalChain.bookings.get(appointmentId);
    if (!originalPatient || originalPatient !== patientName) {
      return res.status(403).json({ error: "Authorization failed: Only the original booker can cancel." });
    }

    // Find the original booking data to get doctor and time
    const originalBlock = hospitalChain.chain.find(b => b.data.appointmentId === appointmentId && b.data.status === AppointmentStatus.BOOKED);

    if (!originalBlock) {
      return res.status(404).json({ error: "Original appointment not found." });
    }

    const cancelBlock = hospitalChain.addBlock({
      ...originalBlock.data,
      status: AppointmentStatus.CANCELLED,
    });

    res.json({ success: true, block: cancelBlock });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

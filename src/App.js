
import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCG9IcEuW2mhQ4fcqHS92NpGwaA5fGFwKM",
  authDomain: "invictus-job-manager.firebaseapp.com",
  projectId: "invictus-job-manager",
  storageBucket: "invictus-job-manager.firebasestorage.app",
  messagingSenderId: "146884492392",
  appId: "1:146884492392:web:f28074d8221970599d4fdd",
  measurementId: "G-P6VQSWLDY5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({ name: "", date: "", dropbox: "", assignedTo: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setRole(userSnap.data().role);
          fetchJobs(userSnap.data().role, currentUser.email);
        }
      } else {
        setRole("");
        setJobs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchJobs = async (userRole, userEmail) => {
    const jobsRef = collection(db, "jobs");
    const q = userRole === "admin"
      ? query(jobsRef)
      : query(jobsRef, where("assignedTo", "==", userEmail));
    const snap = await getDocs(q);
    setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("Login failed");
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const createJob = async () => {
    const docRef = await addDoc(collection(db, "jobs"), newJob);
    setJobs([...jobs, { ...newJob, id: docRef.id }]);
    setNewJob({ name: "", date: "", dropbox: "", assignedTo: "" });
  };

  if (!user) {
    return (
      <div className="p-4 max-w-sm mx-auto space-y-4">
        <h2 className="text-xl font-bold">Login</h2>
        <input className="border p-2 w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2 w-full" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 w-full">Login</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Install Manager</h1>
        <button onClick={handleLogout} className="text-red-600">Logout</button>
      </div>

      {role === "admin" && (
        <div className="bg-white p-4 rounded shadow max-w-md space-y-2">
          <h2 className="text-lg font-semibold">Add New Job</h2>
          <input placeholder="Customer Name" className="w-full border p-2" value={newJob.name} onChange={(e) => setNewJob({ ...newJob, name: e.target.value })} />
          <input type="date" className="w-full border p-2" value={newJob.date} onChange={(e) => setNewJob({ ...newJob, date: e.target.value })} />
          <input placeholder="Dropbox Survey Folder Link" className="w-full border p-2" value={newJob.dropbox} onChange={(e) => setNewJob({ ...newJob, dropbox: e.target.value })} />
          <input placeholder="Assign to (email)" className="w-full border p-2" value={newJob.assignedTo} onChange={(e) => setNewJob({ ...newJob, assignedTo: e.target.value })} />
          <button onClick={createJob} className="bg-green-600 text-white px-4 py-2 rounded">Create Job</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-3 rounded shadow space-y-2">
            <h3 className="font-bold text-lg">{job.name}</h3>
            <p className="text-sm">Date: {job.date}</p>
            <p className="text-sm">Assigned to: {job.assignedTo}</p>
            <a href={job.dropbox} className="text-blue-600 text-sm underline" target="_blank" rel="noreferrer">Survey Folder</a>
            <a href={`${job.dropbox}/Install%20Photos`} className="text-green-600 text-sm underline" target="_blank" rel="noreferrer">Upload Photos</a>
          </div>
        ))}
      </div>
    </div>
  );
}

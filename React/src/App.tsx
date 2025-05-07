import React, { useState, useEffect } from "react";
import "bootswatch/dist/Flatly/bootstrap.min.css";
import axios from "axios";

const App: React.FC = () => {
  const [formData, setFormData] = useState({ company: "", url: "" });
  const [newJobs, setNewJobs] = useState<any[]>([]); // State for new jobs
  const [watchlist, setWatchlist] = useState<any[]>([]);

  const fetchWatchlist = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/watchlist");
      setWatchlist(response.data);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    }
  };

  useEffect(() => {
    fetchWatchlist(); // Load watchlist on mount
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission to add a company to the watchlist
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company || !formData.url) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setFormData({ company: "", url: "" }); // Clear the form
      } else {
        alert(data.message || "Submission failed.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle running the scraper and fetching the new job postings
  const handleRunScraper = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/run-scraper", {
        method: "GET",
      });

      const data = await response.json();
      if (response.ok) {
        alert("Scraper ran successfully.");
        updateNewJobs(data); // `data` is the array from Flask
      } else {
        alert(data.message || "Failed to run the scraper.");
      }
    } catch (error) {
      console.error("Error running scraper:", error);
      alert("An error occurred while running the scraper.");
    }
  };

  const updateNewJobs = (changes: any) => {
    const newJobPostings: any[] = [];

    changes.forEach((change: any) => {
      const company = change.company;
      change.changes.new_lines.forEach((line: string) => {
        newJobPostings.push({ company, description: line });
      });
    });

    setNewJobs(newJobPostings);
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center my-5">
        <h2 className="display-4 m-0">Internships/Co-op Update Alerts</h2>
        <button className="btn btn-primary btn-lg" onClick={handleRunScraper}>
          Check for New Postings
        </button>
      </div>

      <h3 className="mb-3">Add Company to Watchlist</h3>

      <form onSubmit={handleSubmit} className="mb-5">
        <div className="row g-2">
          <div className="col-md-2">
            <input
              type="text"
              name="company"
              placeholder="Company"
              value={formData.company}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-md-8">
            <input
              type="text"
              name="url"
              placeholder="Job URL"
              value={formData.url}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="my-3">
          <button type="submit" className="btn btn-success">
            Submit
          </button>
        </div>
      </form>
      <h3 className="mb-3">Watchlist</h3>
      <table className="table table-bordered">
        <thead className="table-secondary">
          <tr>
            <th style={{ width: "30%" }}>Company</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          {watchlist.length > 0 ? (
            watchlist.map((item, index) => (
              <tr key={index}>
                <td>{item.company}</td>
                <td>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.url}
                  </a>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2}>No companies in watchlist.</td>
            </tr>
          )}
        </tbody>
      </table>
      <h3 className="mb-3">New Jobs Since Last Update</h3>
      <table className="table table-bordered table-striped">
        <thead className="table-info">
          <tr>
            <th style={{ width: "10%" }}>Company</th>
            <th style={{ width: "70%" }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {newJobs.length > 0 ? (
            newJobs.map((job, index) => (
              <tr key={index}>
                <td>{job.company}</td>
                <td>{job.description}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2}>No new job postings.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default App;

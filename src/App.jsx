import React, { useState } from 'react';
import { AlertTriangle, FileText, TrendingUp, Clock, CheckCircle, XCircle, Search, Brain, Shield } from 'lucide-react';

// Sample knowledge base with metadata
const knowledgeBase = [
  {
    id: 1,
    document: "Florida_Flood_Policy_2024.pdf",
    page: 12,
    paragraph: 3,
    content: "All flood damage claims exceeding $200,000 in Florida require mandatory secondary inspection by a certified structural engineer before approval.",
    keywords: ["flood", "florida", "secondary inspection", "200000"],
    category: "policy"
  },
  {
    id: 2,
    document: "Company_SOP_Claims_v3.pdf",
    page: 8,
    paragraph: 2,
    content: "Maximum payout for residential flood claims is capped at $250,000 per policy year, regardless of damage assessment.",
    keywords: ["flood", "maximum", "250000", "residential"],
    category: "sop"
  },
  {
    id: 3,
    document: "FEMA_Guidelines_2024.pdf",
    page: 45,
    paragraph: 7,
    content: "Federal flood insurance permits payouts up to $300,000 for residential properties in designated high-risk zones.",
    keywords: ["flood", "federal", "300000", "residential"],
    category: "regulation"
  },
  {
    id: 4,
    document: "Florida_Flood_Policy_2024.pdf",
    page: 15,
    paragraph: 1,
    content: "Claims submitted without complete damage assessment reports have a mandatory 5-business-day review period before processing.",
    keywords: ["damage assessment", "report", "review period"],
    category: "policy"
  },
  {
    id: 5,
    document: "Audit_Compliance_Guide.pdf",
    page: 23,
    paragraph: 4,
    content: "All claims approved in the final 30 minutes of business hours must undergo secondary review the following business day.",
    keywords: ["audit", "end of day", "secondary review"],
    category: "compliance"
  }
];

// Decision memory database - past cases and outcomes
const decisionMemory = [
  {
    caseType: "Flood",
    state: "Florida",
    amount: 280000,
    decision: "Approved without inspection",
    outcome: "Rejected by manager",
    daysToResolve: 5,
    issue: "Missing secondary inspection report",
    timestamp: "2024-01-15"
  },
  {
    caseType: "Flood",
    state: "Florida",
    amount: 245000,
    decision: "Approved with inspection",
    outcome: "Approved",
    daysToResolve: 2,
    issue: null,
    timestamp: "2024-01-20"
  },
  {
    caseType: "Flood",
    state: "Florida",
    amount: 290000,
    decision: "Approved at $250K (reduced)",
    outcome: "Approved",
    daysToResolve: 3,
    issue: null,
    timestamp: "2024-01-22"
  },
  {
    caseType: "Flood",
    state: "Florida",
    amount: 275000,
    decision: "Approved without inspection",
    outcome: "Audit failure",
    daysToResolve: 10,
    issue: "Compliance violation - missing inspection",
    timestamp: "2024-02-01"
  },
  {
    caseType: "Flood",
    state: "Florida",
    amount: 230000,
    decision: "Approved with inspection",
    outcome: "Approved",
    daysToResolve: 2,
    issue: null,
    timestamp: "2024-02-05"
  }
];

const AppianKnowledgeSystem = () => {
  const [claimType, setClaimType] = useState('');
  const [state, setState] = useState('');
  const [amount, setAmount] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Context-aware retrieval
  const retrieveKnowledge = (type, loc, amt) => {
    const query = `${type} ${loc} ${amt}`.toLowerCase();
    const queryWords = query.split(' ');
    
    return knowledgeBase
      .map(item => {
        const matchScore = queryWords.reduce((score, word) => {
          return score + (item.keywords.some(kw => kw.includes(word)) ? 1 : 0);
        }, 0);
        return { ...item, matchScore };
      })
      .filter(item => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  };

  // Decision memory analysis
  const analyzeDecisionMemory = (type, loc, amt) => {
    const amountNum = parseFloat(amt);
    const similarCases = decisionMemory.filter(
      d => d.caseType.toLowerCase() === type.toLowerCase() && 
           d.state.toLowerCase() === loc.toLowerCase() &&
           Math.abs(d.amount - amountNum) < 50000
    );

    const totalCases = similarCases.length;
    const failedCases = similarCases.filter(d => 
      d.outcome === "Rejected by manager" || 
      d.outcome === "Audit failure"
    ).length;
    
    const avgResolutionTime = totalCases > 0
      ? similarCases.reduce((sum, d) => sum + d.daysToResolve, 0) / totalCases
      : 0;

    const commonIssues = similarCases
      .filter(d => d.issue)
      .reduce((acc, d) => {
        acc[d.issue] = (acc[d.issue] || 0) + 1;
        return acc;
      }, {});

    return {
      totalCases,
      failedCases,
      failureRate: totalCases > 0 ? (failedCases / totalCases * 100).toFixed(0) : 0,
      avgResolutionTime: avgResolutionTime.toFixed(1),
      commonIssues: Object.entries(commonIssues).sort((a, b) => b[1] - a[1])
    };
  };

  // Regret-aware risk calculation
  const calculateRegretScore = (type, loc, amt) => {
    const amountNum = parseFloat(amt);
    let riskFactors = [];
    let regretScore = 0;

    // Check amount against known limits
    if (amountNum > 250000) {
      riskFactors.push({
        factor: "Amount exceeds company maximum ($250K)",
        impact: "High",
        probability: 85
      });
      regretScore += 35;
    }

    if (amountNum > 200000) {
      riskFactors.push({
        factor: "Requires secondary inspection per policy",
        impact: "High",
        probability: 90
      });
      regretScore += 30;
    }

    // Check decision memory patterns
    const memoryAnalysis = analyzeDecisionMemory(type, loc, amt);
    if (memoryAnalysis.failureRate > 50) {
      riskFactors.push({
        factor: `${memoryAnalysis.failureRate}% of similar cases failed review`,
        impact: "High",
        probability: parseInt(memoryAnalysis.failureRate)
      });
      regretScore += 25;
    }

    // Time-based risk (simulated)
    const currentHour = new Date().getHours();
    if (currentHour >= 16) {
      riskFactors.push({
        factor: "Decision made near end of business day",
        impact: "Medium",
        probability: 45
      });
      regretScore += 10;
    }

    return {
      regretScore: Math.min(regretScore, 100),
      riskLevel: regretScore > 70 ? "CRITICAL" : regretScore > 40 ? "HIGH" : "MODERATE",
      riskFactors
    };
  };

  const handleAnalyze = () => {
    if (!claimType || !state || !amount) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    // Simulate processing time
    setTimeout(() => {
      const knowledge = retrieveKnowledge(claimType, state, amount);
      const memory = analyzeDecisionMemory(claimType, state, amount);
      const regret = calculateRegretScore(claimType, state, amount);

      setResults({ knowledge, memory, regret });
      setLoading(false);
    }, 800);
  };

  const getRiskColor = (level) => {
    switch(level) {
      case "CRITICAL": return "text-red-600 bg-red-50 border-red-200";
      case "HIGH": return "text-orange-600 bg-orange-50 border-orange-200";
      default: return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Appian Just-in-Time Knowledge System</h1>
              <p className="text-sm text-slate-600">Context-Aware Intelligence with Decision Memory</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Case Input Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-800">Case Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Claim Type</label>
              <select 
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select type...</option>
                <option value="Flood">Flood</option>
                <option value="Fire">Fire</option>
                <option value="Storm">Storm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
              <select 
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select state...</option>
                <option value="Florida">Florida</option>
                <option value="Texas">Texas</option>
                <option value="California">California</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Claim Amount ($)</label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 250000"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Analyze Case
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Regret-Aware Risk Assessment */}
            <div className={`rounded-lg shadow-md p-6 border-2 ${getRiskColor(results.regret.riskLevel)}`}>
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1">Regret-Aware Risk Assessment</h2>
                  <p className="text-sm opacity-90">Predictive analysis based on historical outcomes</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{results.regret.regretScore}%</div>
                  <div className="text-xs font-medium uppercase">{results.regret.riskLevel}</div>
                </div>
              </div>

              <div className="space-y-3">
                {results.regret.riskFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{factor.factor}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        Impact: <span className="font-medium">{factor.impact}</span> • 
                        Probability: <span className="font-medium">{factor.probability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {results.regret.regretScore > 50 && (
                <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-red-500">
                  <div className="font-semibold text-slate-800 mb-2">⚠️ Recommended Actions:</div>
                  <ul className="text-sm space-y-1 text-slate-700">
                    <li>• Request secondary inspection before approval</li>
                    <li>• Reduce claim amount to company maximum ($250K)</li>
                    <li>• Escalate to regional manager for review</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Decision Memory Insights */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-slate-800">Decision Memory Insights</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">Similar Cases</div>
                  <div className="text-2xl font-bold text-blue-600">{results.memory.totalCases}</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">Failed Cases</div>
                  <div className="text-2xl font-bold text-red-600">{results.memory.failedCases}</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">Failure Rate</div>
                  <div className="text-2xl font-bold text-orange-600">{results.memory.failureRate}%</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">Avg Resolution</div>
                  <div className="text-2xl font-bold text-green-600">{results.memory.avgResolutionTime}d</div>
                </div>
              </div>

              {results.memory.commonIssues.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="font-semibold text-slate-800 mb-3">Common Issues in Similar Cases:</div>
                  <div className="space-y-2">
                    {results.memory.commonIssues.map(([issue, count], idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-slate-700">{issue}</span>
                        <span className="px-3 py-1 bg-slate-200 rounded-full text-sm font-medium">
                          {count} {count === 1 ? 'case' : 'cases'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Knowledge Suggestions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-slate-800">Relevant Policy Rules</h2>
              </div>

              <div className="space-y-4">
                {results.knowledge.map((item) => (
                  <div key={item.id} className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-slate-800 leading-relaxed mb-3">{item.content}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">{item.document}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Page {item.page}</span>
                            <span>•</span>
                            <span>¶{item.paragraph}</span>
                          </div>
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium uppercase">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!results && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Ready to Analyze</h3>
            <p className="text-slate-600">Enter case details above to receive context-aware knowledge suggestions</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-6 py-4 mt-8">
        <div className="text-center text-sm text-slate-600">
          <p>Enterprise AI Knowledge System • Built with Decision Memory & Regret-Aware Intelligence</p>
          <p className="mt-1">Demo using sample data • Production would integrate with Appian via REST APIs</p>
        </div>
      </div>
    </div>
  );
};

export default AppianKnowledgeSystem;

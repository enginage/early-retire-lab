import React, { useState, useEffect } from 'react';
import InputForm from '../../components/InputForm';
import SimulationTable from '../../components/SimulationTable';
import { calculateProjection } from '../../utils/calculate';

function Simulation({ initialBalance: propInitialBalance, targetClosingBalance: propTargetClosingBalance }) {
  const [inputs, setInputs] = useState({
    startYear: new Date().getFullYear(),
    startAge: 40,
    initialBalance: propInitialBalance || 200000000,
    targetReturnRate: 20.0,
    additionalInvestment: 20000000,
    additionalInvestmentReturnRate: 10.0,
    targetClosingBalance: propTargetClosingBalance || 1000000000,
    additionalInvestmentGrowthRate: 0,
  });

  // props가 변경되면 inputs 업데이트
  useEffect(() => {
    if (propInitialBalance !== undefined) {
      setInputs(prev => ({
        ...prev,
        initialBalance: propInitialBalance,
      }));
    }
  }, [propInitialBalance]);

  useEffect(() => {
    if (propTargetClosingBalance !== undefined) {
      setInputs(prev => ({
        ...prev,
        targetClosingBalance: propTargetClosingBalance,
      }));
    }
  }, [propTargetClosingBalance]);

  const [simulationData, setSimulationData] = useState([]);

  useEffect(() => {
    // Basic validation to prevent NaN issues during typing
    const validInputs = {
      startYear: Number(inputs.startYear) || 2025,
      startAge: Number(inputs.startAge) || 40,
      initialBalance: Number(inputs.initialBalance) || 0,
      targetReturnRate: Number(inputs.targetReturnRate) || 0,
      additionalInvestment: Number(inputs.additionalInvestment) || 0,
      additionalInvestmentReturnRate: Number(inputs.additionalInvestmentReturnRate) || 0,
      targetClosingBalance: Number(inputs.targetClosingBalance) || 0,
      additionalInvestmentGrowthRate: Number(inputs.additionalInvestmentGrowthRate) || 0,
    };

    const data = calculateProjection(
      validInputs.startYear,
      validInputs.startAge,
      validInputs.initialBalance,
      validInputs.targetReturnRate,
      validInputs.additionalInvestment,
      validInputs.additionalInvestmentReturnRate,
      validInputs.targetClosingBalance,
      validInputs.additionalInvestmentGrowthRate
    );
    setSimulationData(data);
  }, [inputs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-8">
      <InputForm inputs={inputs} handleChange={handleChange} />
      <SimulationTable data={simulationData} />
    </div>
  );
}

export default Simulation;


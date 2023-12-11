import {
    Box,
    Step, StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    Stepper, StepSeparator,
    StepStatus,
    StepTitle,
    useSteps
} from "@chakra-ui/react";

export default function ReservationStepper({ steps, activeStep, tabSwitch }) {
    const { setActiveStep } = useSteps({
        index: activeStep,
        count: steps.length,
    });

    const handleStepClick = (index) => {
        tabSwitch(index);
    };

    return (
        <Stepper index={activeStep}>
            {steps.map((step, index) => (
                <Step key={index} onClick={() => handleStepClick(index)}>
                    <StepIndicator>
                        <StepStatus
                            complete={<StepIcon />}
                            incomplete={<StepNumber />}
                            active={<StepNumber />}
                        />
                    </StepIndicator>

                    <Box display={{ base: "none", md: "block" }}>
                        <StepTitle>{step.title}</StepTitle>
                        <StepDescription>{step.description}</StepDescription>
                    </Box>

                    <StepSeparator />
                </Step>
            ))}
        </Stepper>
    )
}
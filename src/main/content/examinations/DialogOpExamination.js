import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
} from "@material-ui/core";
import { connect } from "react-redux";
import * as Actions from "./store/actions";
import { bindActionCreators } from "redux";

class DialogOpExamination extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabValue: 0,
    };
  }

  renderDigitalSignature = (examination) => {
    const {
      person: { digitalSignatureUrl },
    } = examination;
    if (digitalSignatureUrl)
      return (
        <a href={digitalSignatureUrl} rel="noopener noreferrer" target="_blank">
          Descargar
        </a>
      );
    else return "No posee firma en el sistema";
  };

  handleClose = () => {
    this.props.onClose();
  };

  handleChangeTab = (event, tabValue) => {
    this.setState({ tabValue });
  };

  handleAceppt = () => {
    this.props.onClose();
    this.props.deleteExamination(this.props.examination.id);
  };

  processData = (examination) => {
    const examinationGroups = [];

    examination.examinationGroups.forEach((eG) => {
      const examGroup = {
        id: eG.id,
        name: eG.name,
      };
      examinationGroups.push(examGroup);
    });

    return {
      ...examination,
      examinationGroups,
    };
  };

  render() {
    const { examination = {}, dialog, flagDelete } = this.props;
    const processedExamData = this.processData(examination);
    const { tabValue } = this.state;
    return (
      <div>
        <Dialog
          open={dialog}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">
            {flagDelete && "¿Seguro que desea eliminar este examen?"}
            {!flagDelete && "Detalles del examen"}
            <Tabs
              value={tabValue}
              onChange={this.handleChangeTab}
              indicatorColor="primary"
              textColor="primary"
              scrollable
              scrollButtons="auto"
              variant="fullWidth"
              classes={{ root: "w-full h-64" }}
            >
              <Tab className="h-64 normal-case" label="Datos básicos" />
              <Tab className="h-64 normal-case" label="Valores del grupo" />
              <Tab className="h-64 normal-case" label="Datos técnicos" />
            </Tabs>
          </DialogTitle>
          <DialogContent>
            {tabValue === 0 && (
              <div>
                <p>
                  <b>Nombre: </b>
                  {processedExamData.name}
                </p>
                <p>
                  <b>Servicio: </b>
                  {processedExamData.service.name}
                </p>
                <p style={{ whiteSpace: "pre-line" }}>
                  <b>Indicaciones: </b>
                  {processedExamData.indications}
                </p>
              </div>
            )}
            {tabValue === 1 && (
              <div>
                {processedExamData.examinationGroups.map((eG, i) => (
                  <p style={{ whiteSpace: "pre-line" }} key={eG.id}>
                    {i + 1}. <b>{eG.name}</b>
                  </p>
                ))}
              </div>
            )}

            {tabValue === 2 && (
              <div>
                <p>
                  <b>Tipo(s) de muestra: </b>
                  {processedExamData.typeSample}
                </p>
                <p>
                  <b>Volumen: </b>
                  {processedExamData.volume}
                </p>
                <p>
                  <b>Insumos: </b>
                  {processedExamData.supplies}
                </p>
                <p>
                  <b>Temperatura de conservación: </b>
                  {processedExamData.storageTemperature}
                </p>
                <p>
                  <b>Condiciones de ayuno: </b>
                  {processedExamData.fastingConditions}
                </p>
                <p>
                  <b>Frecuencia de corridas: </b>
                  {processedExamData.runFrequency}
                </p>
                <p>
                  <b>Hora de proceso: </b>
                  {processedExamData.processTime}
                </p>
                <p>
                  <b>Tiempo de reporte: </b>
                  {processedExamData.reportTime}
                </p>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              Cancelar
            </Button>
            {flagDelete && (
              <Button
                onClick={this.handleAceppt}
                disabled={this.props.isLoadingRequest}
                color="primary"
              >
                Eliminar
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      deleteExamination: Actions.deleteExamination,
    },
    dispatch
  );
}

function mapStateToProps({ examinationsReducer, fuse }) {
  return {
    isLoadingRequest: fuse.request.loading > 0,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DialogOpExamination);

import React, { Component } from "react";
import {
  withStyles,
  Button,
  Tab,
  Tabs,
  Grid,
  TextField,
  Icon,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TablePagination,
  TableRow,
} from "@material-ui/core";
import MenuItem from "@material-ui/core/MenuItem";
import { FuseAnimate, FusePageCarded } from "@fuse";
import { Link, withRouter } from "react-router-dom";
import ExaminationsTableHead from "./ExaminationsTableHead";
import { bindActionCreators } from "redux";
import connect from "react-redux/es/connect/connect";
import * as Actions from "./store/actions";
import _ from "@lodash";
import withReducer from "store/withReducer";
import reducer from "./store/reducers";
import { hasEmptyField, hasArrayEmptyField } from "Utils";
import { showMessage, fetch_end, fetch_start } from "store/actions/fuse";
import Select from "react-select";
import {
  saveServiceApi,
  saveMethodApi,
  saveUnitApi,
  saveReferenceValueApi,
  getServicesAllApi,
  getMethodsAllApi,
  getUnitsAllApi,
  getExaminationValuesByExamId,
} from "../../../api";
import DataTables from "material-ui-datatables";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { FuseUtils } from "@fuse";

import DialogCreateMaster from "../global/DialogCreateMaster";

const styles = (theme) => ({
  selected: {
    backgroundColor: "white !important",
  },
});

const fieldsNewReferenceValue = [
  {
    name: "name",
    label: "Nombre",
  },
  {
    name: "unit",
    label: "Unidad",
  },
];

const fieldsNewService = [
  {
    name: "name",
    label: "Nombre",
  },
  {
    name: "description",
    label: "Descripción",
  },
];

const fieldsNewMethod = [
  {
    name: "name",
    label: "Nombre",
  },
  {
    name: "description",
    label: "Descripción",
  },
];

const fieldsNewGroup = [
  {
    name: "name",
    label: "Nombre",
  },
];

const fieldsNewUnit = [
  {
    name: "name",
    label: "Nombre",
  },
];

class Examination extends Component {
  state = {
    tabValue: 0,
    form: null,
    examGroups: [],
    examValues: [],
    services: [],
    methods: [],
    agreements: [],
    units: [],
    newReferenceValues: [],
    referenceValues: [],
    groups: [], //array of string
    selected: {},
    autoSelect: "",
    dialogReferenceValue: false,
    dialogService: false,
    dialogMethod: false,
    dialogGroup: false,
    dialogUnit: false,
  };

  closeDialogReferenceValue = (response) => {
    this.setState({ dialogReferenceValue: false });
    if (response)
      //If the new reference value has been added
      this.fetchReferenceValues();
  };

  closeDialogGroup = (response) => {
    this.setState({ dialogGroup: false });
  };

  closeDialogService = (response) => {
    this.setState({ dialogService: false });
    if (response)
      //If the new service has been added
      this.fetchServices();
  };
  closeDialogUnit = (response) => {
    this.setState({ dialogUnit: false });
    if (response) this.fetchUnits();
  };

  closeDialogMethod = (response) => {
    this.setState({ dialogMethod: false });
    if (response)
      //If the new service has been added
      this.fetchMethods();
  };

  openDialogUnit = () => {
    this.setState({ dialogUnit: true });
  };

  openDialogService = () => {
    this.setState({ dialogService: true });
  };

  openDialogMethod = () => {
    this.setState({ dialogMethod: true });
  };

  firstTabIsValid = (tabValue) => {
    const { form, examGroups } = this.state;
    const fields = {
      name: form.name,
      ServiceId: form.ServiceId,
    };

    if (_.isEmpty(examGroups) || hasEmptyField(fields)) {
      tabValue &&
        this.props.showMessage({
          message:
            "Por favor antes de guardar, llenar todos los campos necesarios",
          variant: "error",
        });
      return false;
    }
    return tabValue ? this.setState({ tabValue }) : true;
  };

  secondTabIsValid = (tabValue) => {
    const { form, examGroups, examValues } = this.state;

    let needsExamValue;

    if (!this.firstTabIsValid()) {
      tabValue &&
        this.props.showMessage({
          message:
            "Por favor antes de guardar, llenar todos los campos necesarios",
          variant: "error",
        });
      return false;
    }

    if (examGroups.length < 1) return false;

    for (let i = 0; i < examGroups.length; i++) {
      const examGroup = examGroups[i];
      const hasExamValue = examValues.find(
        (val) => val.examGroup.id == examGroup.id
      );
      if (!hasExamValue) {
        needsExamValue = examGroup;
        break;
      }
    }

    if (needsExamValue) {
      tabValue &&
        this.props.showMessage({
          message: `Falta el examen valor para ${needsExamValue.name}`,
          variant: "error",
        });
      return false;
    }

    return tabValue ? this.setState({ tabValue }) : true;
  };

  handleChangeTab = (event, tabValue) => {
    switch (tabValue) {
      case 1:
        this.firstTabIsValid(tabValue);
        return;
      case 2:
        this.secondTabIsValid(tabValue);
        return;
      default:
        this.setState({ tabValue });
    }
  };

  handleChange = (event) => {
    this.setState({
      form: _.set(
        { ...this.state.form },
        event.target.name,
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value
      ),
    });
  };

  handleClickAddValue = () => {
    const { form } = this.state;
    let referenceValues = _.cloneDeep(form.referenceValues);
    referenceValues.push({
      id: FuseUtils.generateGUID(),
      allValues: "",
      name: "",
      group: "",
    });
    this.setState({ form: { ...form, referenceValues } });
  };

  handleTableRowClick = (tab, item) => {
    this.selectTable(tab, item);
  };

  canBeSubmitted = () => {
    const { isLoadingRequest } = this.props;

    return (
      !isLoadingRequest && this.firstTabIsValid() && this.secondTabIsValid()
    );
  };

  componentDidMount() {
    this.fetchServices();
    this.fetchMethods();
    this.fetchUnits();
    // this.fetchReferenceValues();
    const params = this.props.match.params;
    const { examinationId } = params;
    const { examination } = this.props;
    if (examinationId === "new") this.props.newExamination();
    else if (!Object(examination).length)
      //If examination is empty, it doesn't come from list, so get from API
      this.props.getExamination(examinationId);
    this.fetchExaminationValues(examinationId);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { examination, isLoadingRequest } = this.props;

    if (examination && !this.state.form && !isLoadingRequest) {
      this.setState({
        form: examination,
        examGroups: examination.examinationGroups,
      });
    }
  }

  fetchServices = () => {
    const { showMessage, fetch_end, fetch_start } = this.props;
    fetch_start();
    getServicesAllApi()
      .then(
        (response) => {
          if (response.status) this.setState({ services: response.data });
        },
        (err) => {
          console.log(err);
          showMessage({
            message: "Error de conexión. Recargue por favor.",
            variant: "error",
          });
        }
      )
      .finally(fetch_end);
  };

  fetchMethods = () => {
    const { showMessage, fetch_end, fetch_start } = this.props;
    fetch_start();
    getMethodsAllApi()
      .then(
        (response) => {
          if (response.status) this.setState({ methods: response.data });
        },
        (err) => {
          console.log(err);
          showMessage({
            message: "Error de conexión. Recargue por favor.",
            variant: "error",
          });
        }
      )
      .finally(fetch_end);
  };

  fetchUnits = () => {
    const { showMessage, fetch_end, fetch_start } = this.props;
    fetch_start();
    getUnitsAllApi()
      .then(
        (response) => {
          if (response.status) this.setState({ units: response.data });
        },
        (err) => {
          console.log(err);
          showMessage({
            message: "Error de conexión. Recargue por favor.",
            variant: "error",
          });
        }
      )
      .finally(fetch_end);
  };

  fetchExaminationValues = (examinationId) => {
    const { showMessage, fetch_end, fetch_start } = this.props;
    fetch_start();
    getExaminationValuesByExamId(examinationId)
      .then(
        (response) => {
          if (response.status) {
            const examValues = response.data;
            this.setState({ examValues });
            examValues.forEach((eV) => {
              const referenceValues = eV.examinationReferenceValues.map(
                (eRV) => ({
                  id: eRV.id,
                  name: eRV.name,
                  examGroup: eV.examGroup,
                  examValue: {
                    id: eV.id,
                    name: eV.name,
                  },
                })
              );
              this.setState((prevState) => ({
                ...prevState,
                newReferenceValues: [
                  ...prevState.newReferenceValues,
                  ...referenceValues,
                ],
              }));
            });
          }
        },
        (err) => {
          console.log(err);
          showMessage({
            message: "Error de conexión. Recargue por favor.",
            variant: "error",
          });
        }
      )
      .finally(fetch_end);
  };

  addExamGroup = () => {
    const { form, examGroups } = this.state;
    if (!form.groupName) {
      this.props.showMessage({
        message: "Please input a group name.",
        variant: "error",
      });
      return;
    }
    const data = {
      id: FuseUtils.generateGUID(),
      name: form.groupName,
    };
    this.setState({
      form: {
        ...form,
        groupName: "",
      },
      examGroups: [...examGroups, data],
    });
  };

  removeExamGroup = (item) => {
    const { examGroups, examValues, newReferenceValues } = this.state;
    this.setState({
      examGroups: examGroups.filter((examGroup) => examGroup.id !== item.id),
      examValues: examValues.filter(
        (examValue) => examValue.examGroup.id !== item.id
      ),
      newReferenceValues: newReferenceValues.filter(
        (refVal) => refVal.examGroup.id !== item.id
      ),
    });
  };

  addExamValue = () => {
    const { form, examValues, selected, methods, units } = this.state;
    const selectedGroup = selected[1];

    if (!selectedGroup) {
      this.props.showMessage({
        message: "Por favor selecciona un grupo de examen.",
        variant: "error",
      });
      return;
    }

    if (!form.valueExamName || !form.unitId || !form.methodId) {
      this.props.showMessage({
        message: "Por favor llenar todos los campos.",
        variant: "error",
      });
      return;
    }

    const methData = methods.find((val) => val.id == form.methodId);
    const unitData = units.find((val) => val.id == form.unitId);
    const data = {
      id: FuseUtils.generateGUID(),
      name: form.valueExamName,
      unit: unitData,
      examGroup: selectedGroup,
      methodology: methData,
    };

    this.setState({
      form: {
        ...form,
        valueExamName: "",
        unitId: "",
        methodId: "",
      },
      examValues: [...examValues, data],
    });
  };

  removeExamValue = (item) => {
    const { examValues, newReferenceValues } = this.state;
    this.setState({
      examValues: examValues.filter((examValue) => examValue.id !== item.id),
      newReferenceValues: newReferenceValues.filter(
        (refVal) => refVal.examValue.id !== item.id
      ),
    });
  };

  addReferenceValue = () => {
    const { form, selected, newReferenceValues } = this.state;

    const selectedValue = selected[2];

    if (!selectedValue) {
      this.props.showMessage({
        message: "Por favor seleccionar un valor del examen.",
        variant: "error",
      });
      return;
    }

    if (!form.referenceValueName) {
      this.props.showMessage({
        message: "Por favor llenar valores de referencía.",
        variant: "error",
      });
      return;
    }

    const data = {
      id: FuseUtils.generateGUID(),
      name: form.referenceValueName,
      examValue: selected[2],
      examGroup: selected[2].examGroup,
    };

    this.setState({
      form: {
        ...form,
        referenceValueName: "",
      },
      newReferenceValues: [...newReferenceValues, data],
    });
  };

  removeRefVal = (item) => {
    const { newReferenceValues } = this.state;
    this.setState({
      newReferenceValues: newReferenceValues.filter(
        (refVal) => refVal.id !== item.id
      ),
    });
  };

  selectTable = (tab, item) => {
    this.setState((prevState) => {
      return {
        selected: {
          ...prevState.selected,
          [tab]: item,
        },
      };
    });
  };

  submit = () => {
    const { form, examGroups, examValues, newReferenceValues } = this.state;
    const { saveExamination, editExamination } = this.props;
    const params = this.props.match.params;
    const { examinationId } = params;
    if (examinationId === "new")
      saveExamination(form, examGroups, examValues, newReferenceValues);
    else editExamination(form, examinationId);
  };

  handleChangeTableValues = (event, referenceValueId) => {
    const {
      target: { value, name },
    } = event;
    const { form } = this.state;
    let referenceValues = _.cloneDeep(this.state.form.referenceValues);
    referenceValues.forEach((rV) => {
      if (rV.id === referenceValueId) rV[name] = value;
    });
    console.log(this.props.examination);
    this.setState({ form: { ...form, referenceValues } });
  };

  removeReferenceValue = (referenceValueId) => {
    const { form } = this.state;
    let referenceValues = _.cloneDeep(this.state.form.referenceValues);
    referenceValues = referenceValues.filter(
      (rV) => rV.id !== referenceValueId
    );
    this.setState({ form: { ...form, referenceValues } });
  };

  stylesAutoSelects = (all) => ({
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    control: (provided, state) => ({
      ...provided,
      height: "56px",
      borderColor: all.name ? provided.borderColor : "red !important",
    }),
  });

  render() {
    const {
      tabValue,
      form,
      services,
      methods,
      examGroups,
      examValues,
      units,
      newReferenceValues,
    } = this.state;
    const {
      params: { examinationId },
    } = this.props.match;
    return (
      <div>
        <FusePageCarded
          classes={{
            toolbar: "p-0",
            header: "min-h-72 h-72 sm:h-136 sm:min-h-136",
          }}
          header={
            form && (
              <div className="flex flex-1 w-full items-center justify-between">
                <div className="flex flex-col items-start max-w-full">
                  <FuseAnimate animation="transition.slideRightIn" delay={300}>
                    <Typography
                      className="normal-case flex items-center sm:mb-12"
                      component={Link}
                      role="button"
                      to="/apps/examinations"
                    >
                      <Icon className="mr-4 text-20">arrow_back</Icon>
                      Exámenes
                    </Typography>
                  </FuseAnimate>

                  <div className="flex items-center max-w-full">
                    <div className="flex flex-col min-w-0">
                      <FuseAnimate
                        animation="transition.slideLeftIn"
                        delay={300}
                      >
                        <Typography className="text-16 sm:text-20 truncate">
                          {examinationId === "new" ? "Nuevo examen" : form.name}
                        </Typography>
                      </FuseAnimate>
                      <FuseAnimate
                        animation="transition.slideLeftIn"
                        delay={300}
                      >
                        <Typography variant="caption">
                          Detalle del examen
                        </Typography>
                      </FuseAnimate>
                    </div>
                  </div>
                </div>
                <FuseAnimate animation="transition.slideRightIn" delay={300}>
                  <Button
                    className="whitespace-no-wrap"
                    variant="contained"
                    disabled={!this.canBeSubmitted()}
                    onClick={() => this.submit()}
                  >
                    Guardar
                  </Button>
                </FuseAnimate>
              </div>
            )
          }
          contentToolbar={
            <Tabs
              value={tabValue}
              onChange={this.handleChangeTab}
              indicatorColor="primary"
              textColor="primary"
              //scrollable
              //scrollButtons="auto"
              centered
              variant="fullWidth"
              classes={{ root: "w-full h-64" }}
            >
              <Tab className="h-64 normal-case" label="Datos básicos" />
              <Tab className="h-64 normal-case" label="Valores del examen" />
              <Tab className="h-64 normal-case" label="Valores Referenciales" />
              <Tab className="h-64 normal-case" label="Datos Técnicos" />
            </Tabs>
          }
          content={
            form && (
              <div className="p-16 sm:p-24">
                {tabValue === 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <TextField
                        className="mt-8 mb-16 mr-8 ml-8"
                        autoComplete="off"
                        label="Nombre"
                        id="name"
                        name="name"
                        error={form.name === ""}
                        required
                        value={form.name}
                        onChange={this.handleChange}
                        variant="outlined"
                        fullWidth
                      />
                      <TextField
                        id="standard-select-currency"
                        className="mt-8 mb-16 mr-8 ml-8"
                        select
                        label="Servicio"
                        name="ServiceId"
                        value={form.ServiceId}
                        error={form.ServiceId === ""}
                        required
                        onChange={this.handleChange}
                        helperText="Por favor seleccione uno"
                        margin="normal"
                        variant="outlined"
                        fullWidth
                      >
                        <MenuItem value="">
                          <Button
                            color="primary"
                            onClick={this.openDialogService}
                            fullWidth
                            variant="contained"
                          >
                            Crear nuevo
                          </Button>
                        </MenuItem>
                        {services.map((option) => (
                          <MenuItem key={option.id} value={option.id}>
                            {option.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </div>
                    <TextField
                      multiline={true}
                      className="mt-8 mb-16"
                      label="Indicaciones"
                      id="indications"
                      name="indications"
                      value={form.indications}
                      // error={form.indications === ""}
                      // required
                      onChange={this.handleChange}
                      rows="5"
                      variant="outlined"
                      fullWidth
                    />
                    <Paper variant="outlined">
                      <div className="p-16 sm:p-24">
                        <Grid container spacing={1}>
                          <Grid container item xs={12} md={9} spacing={3}>
                            <TextField
                              className="mt-8 mb-16 mr-8 ml-8"
                              autoComplete="off"
                              label="Nombre del grupo"
                              id="groupName"
                              name="groupName"
                              error={form.groupName === ""}
                              required
                              value={form.groupName}
                              onChange={this.handleChange}
                              variant="outlined"
                              fullWidth
                            />
                          </Grid>
                          <Grid container item xs={12} md={3} spacing={3}>
                            <Button
                              onClick={() => {
                                this.addExamGroup();
                              }}
                              className="mt-8 mb-16 mr-8 ml-8"
                              color="primary"
                              fullWidth
                              variant="contained"
                            >
                              Add
                            </Button>
                          </Grid>
                        </Grid>
                      </div>
                      <Table className="min-w-xl" aria-labelledby="tableTitle">
                        <TableHead>
                          <TableRow className="h-64">
                            <TableCell>Item</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Eliminar</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {examGroups.map((group, index) => {
                            // 							const isSelected = this.isSelected(n.id);
                            return (
                              <TableRow
                                className="h-64 cursor-pointer"
                                hover
                                role="checkbox"
                                // 								aria-checked={isSelected}
                                tabIndex={-1}
                                key={index}
                                // 								selected={isSelected}
                                //onClick={event => this.handleClick(n)}
                              >
                                <TableCell component="th" scope="row">
                                  {index + 1}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  {group.name}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  <Tooltip title="Eliminar">
                                    <Button
                                      size="small"
                                      color="primary"
                                      onClick={() =>
                                        this.removeExamGroup(group)
                                      }
                                    >
                                      Eliminar
                                    </Button>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {examGroups.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <p
                                  style={{
                                    fontSize: "20px",
                                    textAlign: "center",
                                  }}
                                >
                                  No hay grupo de examen
                                </p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Paper>
                  </div>
                )}
                {tabValue === 1 && (
                  <>
                    <Table className="min-w-xl" aria-labelledby="tableTitle">
                      <TableHead>
                        <TableRow className="h-64">
                          <TableCell>Item</TableCell>
                          <TableCell>Name</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {examGroups.map((group, index) => {
                          const isSelected = this.state.selected[1]
                            ? this.state.selected[1].id === group.id
                            : false;
                          return (
                            <TableRow
                              className="h-64 cursor-pointer"
                              hover
                              role="checkbox"
                              aria-checked={isSelected}
                              tabIndex={-1}
                              key={group.id}
                              selected={isSelected}
                              onClick={(event) =>
                                this.selectTable(tabValue, group)
                              }
                            >
                              <TableCell component="th" scope="row">
                                {index + 1}
                              </TableCell>
                              <TableCell component="th" scope="row">
                                {group.name}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {examGroups.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4}>
                              <p
                                style={{
                                  fontSize: "20px",
                                  textAlign: "center",
                                }}
                              >
                                No hay grupo de examen
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    <Paper variant="outlined">
                      <div className="p-16 sm:p-24">
                        <Grid container spacing={1}>
                          <Grid container item xs={5} md={4} spacing={3}>
                            <TextField
                              className="mt-8 mb-16 mr-8 ml-8"
                              autoComplete="off"
                              label="Valor del examen"
                              id="valueExamName"
                              name="valueExamName"
                              error={form.valueExamName === ""}
                              required
                              value={form.valueExamName}
                              onChange={this.handleChange}
                              variant="outlined"
                              fullWidth
                            />
                          </Grid>
                          <Grid container item xs={5} md={3} spacing={3}>
                            <TextField
                              id="standard-select-currency"
                              className="mt-8 mb-16 mr-8 ml-8"
                              select
                              label="Unidad"
                              name="unitId"
                              value={form.unitId}
                              error={form.unitId === ""}
                              required
                              onChange={this.handleChange}
                              margin="normal"
                              variant="outlined"
                              fullWidth
                            >
                              <MenuItem value="">
                                <Button
                                  color="primary"
                                  onClick={this.openDialogUnit}
                                  fullWidth
                                  variant="contained"
                                >
                                  Crear nuevo
                                </Button>
                              </MenuItem>
                              {units.map((unit, i) => (
                                <MenuItem key={i} value={unit.id}>
                                  {unit.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>

                          <Grid container item xs={5} md={3} spacing={3}>
                            <TextField
                              id="standard-select-currency"
                              className="mt-8 mb-16 mr-8 ml-8"
                              select
                              label="Metodología"
                              name="methodId"
                              value={form.methodId}
                              error={form.methodId === ""}
                              required
                              onChange={this.handleChange}
                              margin="normal"
                              variant="outlined"
                              fullWidth
                            >
                              <MenuItem value="">
                                <Button
                                  color="primary"
                                  onClick={this.openDialogMethod}
                                  fullWidth
                                  variant="contained"
                                >
                                  Crear nuevo
                                </Button>
                              </MenuItem>
                              {methods.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                  {option.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>

                          <Grid container item xs={12} md={2} spacing={3}>
                            <Button
                              onClick={() => {
                                this.addExamValue();
                              }}
                              className="mt-8 mb-16 mr-8 ml-8"
                              color="primary"
                              fullWidth
                              variant="contained"
                            >
                              Add
                            </Button>
                          </Grid>
                        </Grid>
                      </div>
                      <Table className="min-w-xl" aria-labelledby="tableTitle">
                        <TableHead>
                          <TableRow className="h-64">
                            <TableCell>Item</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Unidad</TableCell>
                            <TableCell>Metodología</TableCell>
                            <TableCell>Grupo Examen</TableCell>
                            <TableCell>Eliminar</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {examValues.map((examValue, index) => {
                            // 							const isSelected = this.isSelected(n.id);
                            return (
                              <TableRow
                                className="h-64 cursor-pointer"
                                hover
                                role="checkbox"
                                // 								aria-checked={isSelected}
                                tabIndex={-1}
                                key={index}
                                // 								selected={isSelected}
                                //onClick={event => this.handleClick(n)}
                              >
                                <TableCell component="th" scope="row">
                                  {index + 1}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  {examValue.name}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  {examValue.unit.name}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  {examValue.methodology.name}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  {examValue.examGroup.name}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  <Tooltip title="Eliminar">
                                    <Button
                                      size="small"
                                      color="primary"
                                      onClick={() =>
                                        this.removeExamValue(examValue)
                                      }
                                    >
                                      Eliminar
                                    </Button>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {examValues.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <p
                                  style={{
                                    fontSize: "20px",
                                    textAlign: "center",
                                  }}
                                >
                                  No hay valor del examen
                                </p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Paper>
                  </>
                )}
                {tabValue === 2 && (
                  <>
                    <Table className="min-w-xl" aria-labelledby="tableTitle">
                      <TableHead>
                        <TableRow className="h-64">
                          <TableCell>Item</TableCell>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Unidad</TableCell>
                          <TableCell>Metodología</TableCell>
                          <TableCell>Grupo Examen</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {examValues.map((examValue, index) => {
                          const isSelected = this.state.selected[2]
                            ? this.state.selected[2].id === examValue.id
                            : false;
                          console.log(examValue);
                          return (
                            <TableRow
                              className="h-64 cursor-pointer"
                              hover
                              role="checkbox"
                              aria-checked={isSelected}
                              tabIndex={-1}
                              key={index}
                              selected={isSelected}
                              onClick={(event) =>
                                this.selectTable(tabValue, examValue)
                              }
                            >
                              <TableCell component="th" scope="row">
                                {index + 1}
                              </TableCell>
                              <TableCell component="th" scope="row">
                                {examValue.name}
                              </TableCell>
                              <TableCell component="th" scope="row">
                                {examValue.unit.name}
                              </TableCell>
                              <TableCell component="th" scope="row">
                                {examValue.methodology.name}
                              </TableCell>
                              <TableCell component="th" scope="row">
                                {examValue.examGroup.name}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {examValues.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4}>
                              <p
                                style={{
                                  fontSize: "20px",
                                  textAlign: "center",
                                }}
                              >
                                No hay valor del examen
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    <Paper variant="outlined">
                      <div className="p-16 sm:p-24">
                        <Grid container spacing={1}>
                          <Grid container item xs={12} md={9} spacing={3}>
                            <TextField
                              className="mt-8 mb-16 mr-8 ml-8"
                              autoComplete="off"
                              label="Valor de referencía"
                              id="referenceValueName"
                              name="referenceValueName"
                              error={form.referenceValueName === ""}
                              required
                              value={form.referenceValueName}
                              onChange={this.handleChange}
                              variant="outlined"
                              fullWidth
                            />
                          </Grid>
                          <Grid container item xs={12} md={3} spacing={3}>
                            <Button
                              onClick={() => {
                                this.addReferenceValue();
                              }}
                              className="mt-8 mb-16 mr-8 ml-8"
                              color="primary"
                              fullWidth
                              variant="contained"
                            >
                              Add
                            </Button>
                          </Grid>
                        </Grid>
                      </div>
                      <Table className="min-w-xl" aria-labelledby="tableTitle">
                        <TableHead>
                          <TableRow className="h-64">
                            <TableCell>Item</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Examen Valor</TableCell>
                            <TableCell>Grupo Examen</TableCell>
                            <TableCell>Eliminar</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {newReferenceValues.map((value, index) => {
                            // 							const isSelected = this.isSelected(n.id);
                            return (
                              <TableRow
                                className="h-64 cursor-pointer"
                                hover
                                role="checkbox"
                                // aria-checked={isSelected}
                                tabIndex={-1}
                                key={index}
                              >
                                <TableCell component="th" scope="row">
                                  {index + 1}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  {value.name}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  {value.examValue.name}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  {value.examGroup.name}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                  <Tooltip title="Eliminar">
                                    <Button
                                      size="small"
                                      color="primary"
                                      onClick={() => this.removeRefVal(value)}
                                    >
                                      Eliminar
                                    </Button>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {newReferenceValues.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <p
                                  style={{
                                    fontSize: "20px",
                                    textAlign: "center",
                                  }}
                                >
                                  No hay valores de referencía
                                </p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Paper>
                  </>
                )}
                {tabValue === 3 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <TextField
                        className="mt-8 mb-16 mr-8 ml-8"
                        autoComplete="off"
                        label="Tipo(s) de muestra"
                        id="typeSample"
                        name="typeSample"
                        //error={form.typeSample === ''}
                        //required
                        value={form.typeSample}
                        onChange={this.handleChange}
                        variant="outlined"
                        fullWidth
                      />
                      <TextField
                        className="mt-8 mb-16 mr-8 ml-8"
                        autoComplete="off"
                        label="Volumen"
                        id="volume"
                        name="volume"
                        //error={form.volume === ''}
                        //required
                        value={form.volume}
                        onChange={this.handleChange}
                        variant="outlined"
                        fullWidth
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <TextField
                        className="mt-8 mb-16 mr-8 ml-8"
                        autoComplete="off"
                        label="Insumos"
                        id="supplies"
                        name="supplies"
                        //error={form.supplies === ''}
                        //required
                        value={form.supplies}
                        onChange={this.handleChange}
                        variant="outlined"
                        fullWidth
                      />
                      <TextField
                        className="mt-8 mb-16 mr-8 ml-8"
                        autoComplete="off"
                        label="Temperatura de conservación"
                        id="storageTemperature"
                        name="storageTemperature"
                        //error={form.storageTemperature === ''}
                        //required
                        value={form.storageTemperature}
                        onChange={this.handleChange}
                        variant="outlined"
                        fullWidth
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <TextField
                        className="mt-8 mb-16 mr-8 ml-8"
                        autoComplete="off"
                        label="Condiciones de ayuno"
                        id="fastingConditions"
                        name="fastingConditions"
                        //error={form.fastingConditions === ''}
                        //required
                        value={form.fastingConditions}
                        onChange={this.handleChange}
                        variant="outlined"
                        fullWidth
                      />
                      <TextField
                        className="mt-8 mb-16 mr-8 ml-8"
                        label="Frecuencia de corridas"
                        autoComplete="off"
                        id="runFrequency"
                        name="runFrequency"
                        //error={form.runFrequency === ''}
                        //required
                        value={form.runFrequency}
                        onChange={this.handleChange}
                        variant="outlined"
                        fullWidth
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <TextField
                        className="mt-8 mb-16 mr-8 ml-8"
                        autoComplete="off"
                        label="Hora de proceso"
                        id="processTime"
                        name="processTime"
                        //error={form.processTime === ''}
                        //required
                        value={form.processTime}
                        onChange={this.handleChange}
                        variant="outlined"
                        fullWidth
                      />
                      <TextField
                        className="mt-8 mb-16 mr-8 ml-8"
                        autoComplete="off"
                        label="Tiempo de reporte"
                        id="reportTime"
                        name="reportTime"
                        //error={form.reportTime === ''}
                        //required
                        value={form.reportTime}
                        onChange={this.handleChange}
                        variant="outlined"
                        fullWidth
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          }
          innerScroll
        />

        {this.state.dialogService && (
          <DialogCreateMaster
            dialog={this.state.dialogService}
            onResponse={this.closeDialogService}
            fields={fieldsNewService}
            title="Nuevo servicio"
            onFetchApi={saveServiceApi}
          />
        )}
        {this.state.dialogMethod && (
          <DialogCreateMaster
            dialog={this.state.dialogMethod}
            onResponse={this.closeDialogMethod}
            fields={fieldsNewMethod}
            title="Nuevo método"
            onFetchApi={saveMethodApi}
          />
        )}

        {this.state.dialogUnit && (
          <DialogCreateMaster
            dialog={this.state.dialogUnit}
            onResponse={this.closeDialogUnit}
            fields={fieldsNewUnit}
            title="Nuevo sub unit"
            onFetchApi={saveUnitApi}
          />
        )}
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      newExamination: Actions.newExamination,
      saveExamination: Actions.saveExamination,
      editExamination: Actions.editExamination,
      getExamination: Actions.getExamination,
      showMessage,
      fetch_end,
      fetch_start,
    },
    dispatch
  );
}

function mapStateToProps({ examinationsReducer, fuse }) {
  return {
    isLoadingRequest: fuse.request.loading > 0,
    examination: examinationsReducer.examination.data,
  };
}

export default withReducer("examinationsReducer", reducer)(
  withStyles(styles, { withTheme: true })(
    withRouter(
      connect(
        mapStateToProps,
        mapDispatchToProps
      )(Examination)
    )
  )
);
